import { NextRequest, NextResponse } from 'next/server'
import { reviewTaskCreation } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskData, calendarEvents } = body

    // Validate required fields
    if (!taskData?.title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    // Get user from auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not initialized' }, { status: 500 })
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate AI review
    const review = await reviewTaskCreation(taskData, calendarEvents)

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error in task review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
