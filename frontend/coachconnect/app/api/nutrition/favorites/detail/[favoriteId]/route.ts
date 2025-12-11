import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { favoriteId: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${BACKEND_URL}/favorites/detail/${params.favoriteId}?user_id=${userId}`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch favorite detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}