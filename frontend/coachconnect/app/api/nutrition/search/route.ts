// app/api/nutrition/search/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query')
  const quantity = searchParams.get('quantity') || '100'
  const pageSize = searchParams.get('page_size') || '25'
  const page = searchParams.get('page') || '1'

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/search?query=${encodeURIComponent(query)}&quantity=${quantity}&page_size=${pageSize}&page=${page}`
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}