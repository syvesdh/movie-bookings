// Shared DB row + API types for the cinema booking platform.

export type SeatStatus = "AVAILABLE" | "LOCKED" | "BOOKED";
export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "EXPIRED";

export interface Movie {
  id: string;
  title: string;
  description: string | null;
  trailer_url: string | null;
  genre: string | null;
  release_date: string | null;
  duration: number | null;
  poster_url: string | null;
}

export interface Show {
  id: string;
  movie_id: string;
  screen_name: string;
  start_time: string;
  end_time: string;
  price: number;
}

export interface MovieWithShows extends Movie {
  shows: Show[];
}

// A single seat in the seat-map response.
export interface SeatCell {
  show_seat_id: string; // show_seats.id — what the lock API expects
  row_num: string;
  col_num: number;
  status: SeatStatus;
}

export interface SeatMap {
  show: Show & { movie_title: string };
  screen_name: string;
  rows: string[];
  cols: number[];
  seats: SeatCell[];
}

export interface LockResponse {
  booking_id: string;
  status: BookingStatus;
  expires_at: string;
  total_price: number;
}

export interface BookingDetail {
  id: string;
  status: BookingStatus;
  total_price: number;
  expires_at: string;
  created_at: string;
  show: Show & { movie_title: string; poster_url: string | null };
  seats: { row_num: string; col_num: number }[];
}
