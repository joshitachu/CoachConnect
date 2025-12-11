import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/favorites/add-from-barcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || 'Failed to add favorite from barcode' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Add favorite from barcode error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}