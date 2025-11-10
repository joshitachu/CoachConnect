import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Get the email query parameter from the request
    const url = new URL(request.url)
    const email = url.searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "User not logged in" },
        { status: 401 }
      )
    }

    // Make the GET request to your Python backend with the email
    const res = await fetch(`http://127.0.0.1:8000/api/form-show?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Check if the response is successful
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`Backend error: ${res.status} - ${errorText}`)
      throw new Error(`Backend error: ${res.statusText}`)
    }

    const form = await res.json()

    // Return the response from the backend (which has the structure {form_schemas: [...]})
    console.log("Fetched form configuration:", form)
    return NextResponse.json(form)
  } catch (error) {
    console.error("Error fetching form:", error)
    return NextResponse.json(
      { error: "Failed to load form configuration" },
      { status: 500 }
    )
  }
}