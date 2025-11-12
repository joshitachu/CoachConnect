
// ===================================
// app/api/client/select-trainer/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const session = await verifySession(token)
    
    if (session.role !== "client") {
      return NextResponse.json({ detail: "Only clients can select trainers" }, { status: 403 })
    }

    const body = await req.json()
    const { trainer_id } = body

    if (!trainer_id) {
      return NextResponse.json({ detail: "trainer_id required" }, { status: 400 })
    }

    // Send to backend to establish the client-trainer relationship
    const res = await fetch(`${BACKEND_URL}/client/select-trainer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        client_id: session.sub,
        trainer_id,
      }),
    })

    const data = await res.json()
    
    if (res.ok) {
      // Optionally update the session cookie with selected trainer info
      // For now, just return success
      return NextResponse.json({ 
        success: true, 
        message: "Trainer selected successfully",
        trainer_id 
      })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Error selecting trainer:", err)
    return NextResponse.json({ detail: "Failed to select trainer" }, { status: 500 })
  }
}