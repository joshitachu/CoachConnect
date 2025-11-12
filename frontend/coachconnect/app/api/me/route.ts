// app/api/me/route.ts
export const runtime = "nodejs" // optional but safe if you use jose

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"

export async function GET() {
  // ⬇️ cookies() is async in route handlers; await it
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return NextResponse.json({ user: null })
  }

  try {
    const s = await verifySession(token)
    return NextResponse.json({
      user: { id: s.sub, email: s.email, role: s.role, first_name: s.first_name, last_name: s.last_name, country: s.country, phone_number: s.phone_number },
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
