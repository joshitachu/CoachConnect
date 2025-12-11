import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function PUT(
  request: NextRequest,
  { params }: { params: { recordId: string } }
) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/intake/update/${params.recordId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to update intake' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Update intake error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
