// Server-side data access. Imported by Server Components and API routes only
// (it uses the service-role client). Keeps query logic in one place.
import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type {
  Movie,
  MovieWithShows,
  SeatMap,
  Show,
  SeatCell,
  BookingDetail,
} from "./types";

export async function getMovies(filters?: {
  name?: string;
  genre?: string;
}): Promise<Movie[]> {
  let q = supabaseAdmin
    .from("movies")
    .select("*")
    .order("release_date", { ascending: false });

  if (filters?.name) q = q.ilike("title", `%${filters.name}%`);
  if (filters?.genre) q = q.ilike("genre", `%${filters.genre}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Movie[];
}

export async function getMovieWithShows(
  movieId: string,
): Promise<MovieWithShows | null> {
  const { data: movie, error } = await supabaseAdmin
    .from("movies")
    .select("*")
    .eq("id", movieId)
    .maybeSingle();
  if (error) throw error;
  if (!movie) return null;

  const { data: shows, error: showErr } = await supabaseAdmin
    .from("shows")
    .select("*")
    .eq("movie_id", movieId)
    .order("start_time", { ascending: true });
  if (showErr) throw showErr;

  return { ...(movie as Movie), shows: (shows ?? []) as Show[] };
}

// Seat map for a show. Lazily expires stale holds before reading so other
// users' timed-out locks free up immediately.
export async function getSeatMap(showId: string): Promise<SeatMap | null> {
  await supabaseAdmin.rpc("expire_stale_bookings", { p_show_id: showId });

  const { data: show, error: showErr } = await supabaseAdmin
    .from("shows")
    .select("*, movies(title)")
    .eq("id", showId)
    .maybeSingle();
  if (showErr) throw showErr;
  if (!show) return null;

  const { data: rows, error } = await supabaseAdmin
    .from("show_seats")
    .select("id, status, seats(row_num, col_num)")
    .eq("show_id", showId);
  if (error) throw error;

  type SeatRow = {
    id: string;
    status: SeatCell["status"];
    seats: { row_num: string; col_num: number };
  };
  const seats: SeatCell[] = ((rows ?? []) as unknown as SeatRow[]).map((r) => ({
    show_seat_id: r.id,
    row_num: r.seats.row_num,
    col_num: r.seats.col_num,
    status: r.status,
  }));

  const rowSet = [...new Set(seats.map((s) => s.row_num))].sort();
  const colSet = [...new Set(seats.map((s) => s.col_num))].sort(
    (a, b) => a - b,
  );

  const movieTitle =
    (show as { movies?: { title?: string } }).movies?.title ?? "Untitled";

  return {
    show: { ...(show as unknown as Show), movie_title: movieTitle },
    screen_name: (show as unknown as Show).screen_name,
    rows: rowSet,
    cols: colSet,
    seats,
  };
}

// Full booking detail for the payment / confirmation pages. Scoped to the
// owner so one patron can't read another's booking.
export async function getBooking(
  bookingId: string,
  userId: string,
): Promise<BookingDetail | null> {
  const { data: b, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, status, total_price, expires_at, created_at, " +
        "shows(id, movie_id, screen_name, start_time, end_time, price, movies(title, poster_url))",
    )
    .eq("id", bookingId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!b) return null;

  const { data: items, error: itemErr } = await supabaseAdmin
    .from("booking_items")
    .select("show_seats(seats(row_num, col_num))")
    .eq("booking_id", bookingId);
  if (itemErr) throw itemErr;

  type BookingRow = {
    id: string;
    status: BookingDetail["status"];
    total_price: number;
    expires_at: string;
    created_at: string;
    shows: {
      id: string;
      movie_id: string;
      screen_name: string;
      start_time: string;
      end_time: string;
      price: number;
      movies: { title: string; poster_url: string | null } | null;
    };
  };
  type ItemRow = { show_seats: { seats: { row_num: string; col_num: number } } };

  const row = b as unknown as BookingRow;
  const show = row.shows;
  const movie = show.movies;

  const seats = ((items ?? []) as unknown as ItemRow[]).map((it) => ({
    row_num: it.show_seats.seats.row_num,
    col_num: it.show_seats.seats.col_num,
  }));
  seats.sort((a, c) =>
    a.row_num === c.row_num
      ? a.col_num - c.col_num
      : a.row_num.localeCompare(c.row_num),
  );

  return {
    id: row.id,
    status: row.status,
    total_price: row.total_price,
    expires_at: row.expires_at,
    created_at: row.created_at,
    show: {
      id: show.id,
      movie_id: show.movie_id,
      screen_name: show.screen_name,
      start_time: show.start_time,
      end_time: show.end_time,
      price: show.price,
      movie_title: movie?.title ?? "Untitled",
      poster_url: movie?.poster_url ?? null,
    },
    seats,
  };
}
