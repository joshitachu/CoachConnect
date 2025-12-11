import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest, context: any) {
  // `context` can be a promise that resolves to an object containing `params`.
  // Await it before using to satisfy Next.js runtime requirements.
  const { params } = await context
  const searchParams = request.nextUrl.searchParams
  const intakeDate = searchParams.get('intake_date')

  try {
    const url = intakeDate
      ? `${BACKEND_URL}/intake/daily/${params.userId}?intake_date=${intakeDate}`
      : `${BACKEND_URL}/intake/daily/${params.userId}`

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch daily intake' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Daily intake error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
