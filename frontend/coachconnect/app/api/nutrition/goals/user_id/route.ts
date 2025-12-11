// app/api/nutrition/goals/[userId]/route.ts
import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  try {
    const response = await fetch(`${BACKEND_URL}/goals/${userId}`)
    
    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch goals' },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}