// app/api/client/link-trainer/route.ts
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function POST(req: NextRequest) {
  // Verify the user is authenticated via cookie
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const session = await verifySession(token)

    // Only clients can link trainers
    if (session.role !== "client") {
      return NextResponse.json(
        { success: false, message: "Only clients can link trainers" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { trainer_code } = body

    if (!trainer_code) {
      return NextResponse.json(
        { success: false, message: "Trainer code is required" },
        { status: 400 }
      )
    }

    console.log("Linking trainer:", { client_email: session.email, trainer_code })

    // Call backend to link trainer
    const res = await fetch(`${BACKEND_URL}/client/link-trainer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_email: session.email,
        trainer_code: trainer_code.trim().toUpperCase(),
      }),
    })

    const data = await res.json()
    console.log("Backend response:", data)

    if (res.ok && data.success) {
      return NextResponse.json({
        success: true,
        message: data.message || "Successfully linked with trainer",
        trainer: data.trainer || null,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to link trainer. Please check the code and try again.",
        },
        { status: res.status }
      )
    }
  } catch (error) {
    console.error("[/api/client/link-trainer] Error:", error)
    return NextResponse.json(
      { success: false, message: "Connection error. Please try again." },
      { status: 500 }
    )
  }
}