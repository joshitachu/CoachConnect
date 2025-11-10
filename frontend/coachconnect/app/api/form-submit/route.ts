import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    const { userEmail, ...formDetails } = formData  // Extract userEmail separately

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email is missing" },
        { status: 400 }
      )
    }

    // Log the incoming form data and email
    console.log("Received form data:", formDetails)
    console.log("User email:", userEmail)

    // Get Python backend URL from environment variable
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000/api/forms"

    // Forward the form data and user email to your Python backend
    const response = await fetch(pythonBackendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...formDetails, userEmail }),  // Send the user email along with the form data
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
