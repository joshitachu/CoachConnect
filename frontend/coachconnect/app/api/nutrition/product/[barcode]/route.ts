
// app/api/nutrition/product/[barcode]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  const searchParams = request.nextUrl.searchParams
  const quantity = searchParams.get('quantity') || '100'

  try {
    const response = await fetch(
      `${BACKEND_URL}/product/${params.barcode}?quantity=${quantity}`
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Product not found' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}