import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BASE_URL =
  process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { trainer_code, email } = data

    if (!trainer_code || !email) {
      return NextResponse.json(
        { error: "Trainer code and email are required" },
        { status: 400 }
      )
    }

    const cleanedCode = String(trainer_code)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")

    console.log("[trainerchange][POST] Updating trainer code:", cleanedCode)
    console.log("[trainerchange][POST] For user:", email)

    const response = await fetch(`${PYTHON_BASE_URL}/trainerchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: cleanedCode, email }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[trainerchange][POST] Backend error:", errorText)
      return NextResponse.json(
        { error: "Failed to update trainer code", details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[trainerchange][POST] Connection error:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
