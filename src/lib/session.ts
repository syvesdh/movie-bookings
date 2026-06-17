import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const COOKIE = "mb_uid";

// Anonymous identity for the booking flow.
// Reads an existing user id from an httpOnly cookie, or mints one.
// When real auth lands later, this is the ONLY function that changes:
// return the authenticated user's id instead of the cookie value.
export async function getOrCreateUserId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return id;
}

// Read-only variant for places where we must not set cookies (e.g. during
// render of a Server Component that only needs to compare ownership).
export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}
