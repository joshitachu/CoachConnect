import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    
    // Valideer dat alle vereiste velden aanwezig zijn, inclusief email
    if (!body?.trainer_code || !body?.form_id || !body?.values) {
      return NextResponse.json(
        { detail: "trainer_code, form_id, values required" }, 
        { status: 422 }
      )
    }

    // Stuur de volledige body door naar backend, inclusief email
    const upstream = await fetch(`${BACKEND_URL}/form-submit-client`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        trainer_code: body.trainer_code,
        form_id: body.form_id,
        values: body.values,
        email: body.email, // Email wordt nu meegestuurd naar backend
      }),
    })

    const raw = await upstream.text()
    let data: any = {}
    
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {}

    if (!upstream.ok) {
      return NextResponse.json(
        data || { detail: "Upstream error" }, 
        { status: upstream.status }
      )
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json(
      { detail: "Backend unavailable" }, 
      { status: 502 }
    )
  }
}