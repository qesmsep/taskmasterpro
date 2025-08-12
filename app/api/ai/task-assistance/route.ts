import { NextRequest, NextResponse } from 'next/server'
import { getTaskAssistance } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { taskTitle, taskDescription, userQuery, projectContext } = body

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

    // Get AI assistance
    const assistance = await getTaskAssistance(
      taskTitle,
      taskDescription,
      userQuery,
      projectContext
    )

    return NextResponse.json(assistance)
  } catch (error) {
    console.error('Error getting task assistance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
