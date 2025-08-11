import { NextRequest, NextResponse } from 'next/server'
import { expandTask } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskTitle, taskDescription, existingSubtasks } = body

    // Get user from auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!taskTitle) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    const result = await expandTask(taskTitle, taskDescription, existingSubtasks)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error expanding task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
