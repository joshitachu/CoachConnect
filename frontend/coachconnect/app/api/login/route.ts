// app/api/login/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 })
  }

  const {
    email,
    password,
    role,
    trainer_code,
  } = (body as {
    email?: string
    password?: string
    role?: "client" | "trainer" | string
    trainer_code?: string | null
  }) || {}

  if (!email || !password) {
    return NextResponse.json(
      { detail: "Email and password required" },
      { status: 400 }
    )
  }

  // Optional: normalize role
  const normalizedRole =
    role === "trainer" ? "trainer" : role === "client" ? "client" : undefined

  try {
    const upstream = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Forward extra fields; FastAPI can ignore them if unused
      body: JSON.stringify({
        email,
        password,
        ...(normalizedRole ? { role: normalizedRole } : {}),
        ...(trainer_code ? { trainer_code } : {}),
      }),
    })

    const data = await upstream.json().catch(() => ({}))

    if (!upstream.ok) {
      return NextResponse.json(
        data || { detail: "Upstream error" },
        { status: upstream.status }
      )
    }

    // Expecting: { success: boolean, message: string, ...optional fields }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { detail: "Backend not reachable at BACKEND_URL" },
      { status: 502 }
    )
  }
}
