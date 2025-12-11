
// app/api/nutrition/intake/week/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const weekDate = searchParams.get('week_date')

  try {
    const url = weekDate
      ? `${BACKEND_URL}/intake/week/${params.userId}?week_date=${weekDate}`
      : `${BACKEND_URL}/intake/week/${params.userId}`

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch weekly summary' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Weekly summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
