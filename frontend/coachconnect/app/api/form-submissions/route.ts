import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const trainers_code = url.searchParams.get("trainers_code")
    const email = url.searchParams.get("email")

    if (!trainers_code && !email) {
      return NextResponse.json({ error: "trainers_code or email required" }, { status: 422 })
    }

    const backendUrl = "http://127.0.0.1:8000/api/form-submissions"
    const query = trainers_code ? `?trainers_code=${encodeURIComponent(trainers_code)}` : `?email=${encodeURIComponent(email!)}`

    const res = await fetch(`${backendUrl}${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    const text = await res.text()
    let data = {}
    try { data = text ? JSON.parse(text) : {} } catch {}

    if (!res.ok) {
      return NextResponse.json(data || { error: "Upstream error" }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Error forwarding submissions request:", err)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
