import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Get Python backend URL from environment variable
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000/api/forms"
    console.log(formData)

    // Forward the form data to your Python backend
    const response = await fetch(pythonBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Python backend error:", errorText)
      return NextResponse.json(
        { error: "Failed to save form to backend", details: errorText },
        { status: response.status },
      )
    }

    const result = await response.json()
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Error forwarding to Python backend:", error)
    return NextResponse.json(
      { error: "Failed to connect to backend", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
