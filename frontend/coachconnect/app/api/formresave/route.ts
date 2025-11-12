import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// If you deploy on Vercel edge and need Node APIs (e.g., fetch with timeouts), keep it on Node.js runtime
export const runtime = "nodejs"

// --- Config ---
// Point this to your backend base URL, e.g. https://api.yourdomain.com
const BACKEND_BASE_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000"
const ENDPOINT_PATH = "/form-resave"

// Optional: require trainer role via header or your auth integration
const ENFORCE_TRAINER = process.env.ENFORCE_TRAINER === "true"

// Basic schema validation for incoming payload
const PayloadSchema = z.object({
  email: z.string().email(),
  formSchema: z.object({}).passthrough(), // accept any shape; your backend will validate strictly
})

// (Optional) minimal shape guard for formSchema
const FormShape = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(z.object({}).passthrough()),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    // Optional role-gate: block non-trainers. Replace this with your real auth (e.g., NextAuth session check).
    if (ENFORCE_TRAINER) {
      const role = req.headers.get("x-user-role")?.toLowerCase()
      if (role !== "trainer") {
        return NextResponse.json({ error: "Forbidden: trainers only" }, { status: 403 })
      }
    }

    const json = await req.json()
    const parsed = PayloadSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    // Optional extra validation on form shape
    const formCheck = FormShape.safeParse(parsed.data.formSchema)
    if (!formCheck.success) {
      return NextResponse.json({ error: "Invalid form schema", details: formCheck.error.flatten() }, { status: 400 })
    }

    if (!BACKEND_BASE_URL) {
      return NextResponse.json({ error: "Server misconfigured: BACKEND_BASE_URL is not set" }, { status: 500 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    const upstreamRes = await fetch(`${BACKEND_BASE_URL}${ENDPOINT_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: parsed.data.email,
        formSchema: parsed.data.formSchema,
      }),
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    const contentType = upstreamRes.headers.get("content-type") || ""
    const isJSON = contentType.includes("application/json")

    if (!upstreamRes.ok) {
      const errBody = isJSON ? await upstreamRes.json().catch(() => ({})) : await upstreamRes.text()
      return NextResponse.json(
        { error: "Upstream error", status: upstreamRes.status, details: errBody },
        { status: 502 }
      )
    }

    const data = isJSON ? await upstreamRes.json() : await upstreamRes.text()

    // Pass-through success response
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Request to backend timed out" }, { status: 504 })
    }
    return NextResponse.json({ error: "Unexpected server error", details: String(err?.message || err) }, { status: 500 })
  }
}

// Optional: block other methods explicitly
export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 })
}
