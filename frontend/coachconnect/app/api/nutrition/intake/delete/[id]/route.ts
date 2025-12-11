import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/intake/delete/${params.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete intake' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Delete intake error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
