// app/api/trainercode/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySession } from "@/lib/auth"

const PYTHON_BASE_URL =
  process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000"

export async function GET(_req: NextRequest) {
  try {
    // In your environment cookies() is async → await it
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value

    let email = ""

    if (token) {
      try {
        const session = await verifySession(token)
        email = session.email
      } catch (err) {
        console.warn("[trainercode][GET] Invalid session token:", err)
      }
    }

    // Build query params: placeholder code + optional email
    const params = new URLSearchParams({ code: "fetch" })
    if (email) params.set("email", email)

    const url = `${PYTHON_BASE_URL}/trainercode?${params.toString()}`
    console.log("[trainercode][GET] Forwarding to:", url)

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[trainercode][GET] Error fetching trainer code:", error)
    return NextResponse.json(
      { error: "Failed to fetch trainer code" },
      { status: 500 },
    )
  }
}
