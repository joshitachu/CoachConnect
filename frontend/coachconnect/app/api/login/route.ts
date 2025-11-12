// app/api/login/route.ts
export const runtime = "nodejs" // ← ensure Node runtime (not Edge)

import { NextRequest, NextResponse } from "next/server"
import { createSession } from "@/lib/auth"

const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 })
  }

  const { email, password, role, trainer_code } =
    (body as { email?: string; password?: string; role?: "client" | "trainer" | string; trainer_code?: string | null }) || {}

  if (!email || !password) {
    return NextResponse.json({ detail: "Email and password required" }, { status: 400 })
  }

  const normalizedRole =
    role === "trainer" ? "trainer" : role === "client" ? "client" : undefined

  try {
    // 🔎 log target once (only in dev)
    if (process.env.NODE_ENV !== "production") {
      console.log("[/api/login] BACKEND_URL:", BACKEND_URL)
    }

    const upstream = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(normalizedRole ? { role: normalizedRole } : {}),
        ...(trainer_code ? { trainer_code } : {}),
      }),
    })

    // Read text first so if JSON parse fails we still see the raw body
    const raw = await upstream.text()
    let data: any = {}
    try { data = raw ? JSON.parse(raw) : {} } catch { /* keep {} */ }

    if (!upstream.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[/api/login] Upstream not OK", upstream.status, raw)
      }
      return NextResponse.json(data || { detail: "Upstream error" }, { status: upstream.status })
    }

    // ✅ Success from backend — try to set cookie, but DO NOT 500 if it fails
    const res = NextResponse.json(data)

    try {
      if (data?.success && data?.user) {
        const token = await createSession({
          sub: String(data.user.id ?? email),
          email: data.user.email ?? email,
          role: (data.user.role === "trainer" ? "trainer" : "client"),
           first_name: data.user.first_name,
            last_name: data.user.last_name,
            country: data.user.country,
            phone_number: data.user.phone_number,
        })
        res.cookies.set("session", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    } catch (e) {
      // Don’t break login if cookie creation errors — just log it
      console.error("[/api/login] Failed to set session cookie:", e)
    }

    return res
  } catch (e) {
    console.error("[/api/login] Fetch to backend failed:", e)
    return NextResponse.json(
      { detail: `Backend not reachable at BACKEND_URL (${BACKEND_URL})` },
      { status: 502 }
    )
  }
}
