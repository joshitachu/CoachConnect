import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/intake/range/${params.userId}?start_date=${startDate}&end_date=${endDate}`
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch intake range' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Intake range error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}