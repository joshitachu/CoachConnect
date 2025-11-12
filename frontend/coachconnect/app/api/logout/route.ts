// app/api/logout/route.ts
import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ success: true })
  // Clear the session cookie
  res.cookies.set("session", "", { path: "/", maxAge: 0 })
  return res
}
