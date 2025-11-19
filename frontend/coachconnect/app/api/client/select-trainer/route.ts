// app/api/client/select-trainer/route.ts
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const auth = request.headers.get("authorization") || "";
    const body = await request.json().catch(() => null);

    if (!body || typeof body.trainer_id !== "number") {
      return NextResponse.json(
        { error: "trainer_id (number) is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/client/select-trainer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        authorization: auth,
        "x-forwarded-host": request.headers.get("host") || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail || "Failed to select trainer" },
        { status: res.status || 502 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (_e) {
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 }
    );
  }
}
