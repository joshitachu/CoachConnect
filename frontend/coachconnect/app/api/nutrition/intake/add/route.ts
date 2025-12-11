import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NUTRITION_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Ensure all required fields are present and correctly typed
    const intake: any = {
      user_id: String(body.user_id),
      product_name: String(body.product_name),
      quantity: parseFloat(body.quantity),
      unit: String(body.unit) || "g",
      calories: parseFloat(body.calories),
      protein: parseFloat(body.protein),
      carbs: parseFloat(body.carbs),
      fat: parseFloat(body.fat),
    }

    // Only add optional fields if they have valid values
    if (body.fiber != null && body.fiber !== '') {
      intake.fiber = parseFloat(body.fiber)
    }
    if (body.sugar != null && body.sugar !== '') {
      intake.sugar = parseFloat(body.sugar)
    }
    if (body.sodium != null && body.sodium !== '') {
      intake.sodium = parseFloat(body.sodium)
    }
    if (body.meal_type) {
      intake.meal_type = String(body.meal_type)
    }
    if (body.intake_date) {
      intake.intake_date = String(body.intake_date)
    }
    if (body.intake_time) {
      intake.intake_time = String(body.intake_time)
    }
    if (body.barcode) {
      intake.barcode = String(body.barcode)
    }

    console.log('Sending intake data:', intake) // Debug log

    const response = await fetch(`${BACKEND_URL}/intake/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(intake),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error adding intake:', errorData)
      return NextResponse.json({ error: 'Failed to add food intake', details: errorData }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Add intake error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}