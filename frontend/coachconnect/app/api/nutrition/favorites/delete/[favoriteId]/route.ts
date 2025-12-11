import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { favoriteId: string } }
) {
  const userId = request.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${BACKEND_URL}/favorites/${params.favoriteId}?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return NextResponse.json({ error: err.detail || 'Failed to delete favorite' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
