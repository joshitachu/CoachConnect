import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const url = new URL(request.url)
    const trainer_code =
      body?.trainer_code ?? url.searchParams.get("trainer_code")

    if (!trainer_code) {
      return NextResponse.json({ detail: "trainer_code is required" }, { status: 422 })
    }

    const upstream = await fetch(`${BACKEND_URL}/form-show`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ trainer_code }),
    })

    const raw = await upstream.text()
    const data = raw ? JSON.parse(raw) : {}

    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 })
  }
}
