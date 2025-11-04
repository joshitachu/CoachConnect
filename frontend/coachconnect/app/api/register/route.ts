// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 })
  }

  const {
    first_name,
    last_name,
    email,
    password,
    phone_number,
    country,
    role,
  } = body || {}

  // Basic validation
  if (!first_name || !last_name || !email || !password || !phone_number || !country || !role) {
    return NextResponse.json(
      { detail: "Missing required fields" },
      { status: 400 }
    )
  }

  try {
    const upstream = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        phone_number,
        country,
        role, // send trainer/client role
      }),
    })

    const data = await upstream.json().catch(() => ({}))

    if (!upstream.ok) {
      return NextResponse.json(
        data || { detail: "Upstream error" },
        { status: upstream.status }
      )
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { detail: "Backend not reachable at BACKEND_URL" },
      { status: 502 }
    )
  }
}
