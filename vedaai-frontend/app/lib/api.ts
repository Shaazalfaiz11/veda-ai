/** Baked at build time; defaults keep local dev working if .env.local is missing. */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5000"
