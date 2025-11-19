// app/api/client/check-trainer/route.ts
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function GET(req: NextRequest) {
  // Verify the user is authenticated via cookie
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const session = await verifySession(token)

    // Non-clients are considered to always "have a trainer" (unchanged behavior)
    if (session.role !== "client") {
      return NextResponse.json({ has_trainer: true, trainers: [] })
    }

    // Build URL with query param (no Authorization header)
    const url = new URL("/client/check-trainer", BACKEND_URL)
    url.searchParams.set("client_email", session.email)

    console.log("Fetching from backend:", url.toString())

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    const data = await res.json().catch(() => ({} as any))
    console.log("Backend response:", data)

    if (res.ok) {
      const hasTrainer = data.has_trainer ?? false
      const trainers = data.trainers ?? []

      console.log("Sending to frontend:", { has_trainer: hasTrainer, trainers })

      return NextResponse.json({
        has_trainer: hasTrainer,
        trainers: trainers, // THIS IS THE KEY LINE - send the trainers array
        trainer: data.trainer ?? null, // Keep for backward compatibility
      })
    } else {
      console.error("Backend error:", data)
      return NextResponse.json({ 
        has_trainer: false, 
        trainers: [] 
      }, { status: 200 })
    }
  } catch (error) {
    console.error("[/api/client/check-trainer] Error:", error)
    return NextResponse.json({ 
      has_trainer: false, 
      trainers: [] 
    }, { status: 200 })
  }
}