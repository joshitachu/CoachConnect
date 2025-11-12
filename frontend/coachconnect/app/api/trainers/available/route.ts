// app/api/trainers/available/route.ts
import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"

const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8000"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session")?.value
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 })
  }

  try {
    const session = await verifySession(token)
    
    // Only clients can see trainer list
    if (session.role !== "client") {
      return NextResponse.json({ detail: "Only clients can view trainers" }, { status: 403 })
    }

    const res = await fetch(`${BACKEND_URL}/trainers/available?client_id=${session.sub}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error("Error fetching trainers:", err)
    return NextResponse.json({ detail: "Failed to fetch trainers" }, { status: 500 })
  }
}
