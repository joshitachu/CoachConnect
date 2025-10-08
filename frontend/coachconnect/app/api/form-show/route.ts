import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Replace with your actual backend endpoint
    const res = await fetch("http://127.0.0.1:8000/api/form-show", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // If you need auth tokens:
      // headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
    })

    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`)
    }

    const form = await res.json()

    return NextResponse.json(form)
  } catch (error) {
    console.error("Error fetching form:", error)
    return NextResponse.json(
      { error: "Failed to load form configuration" },
      { status: 500 }
    )
  }
}
