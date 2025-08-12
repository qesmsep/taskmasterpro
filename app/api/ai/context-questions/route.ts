import { NextRequest, NextResponse } from 'next/server'
import { generateContextQuestions } from '@/lib/ai'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskData } = body

    if (!taskData.title) {
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

    const questions = await generateContextQuestions(taskData)
    
    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error generating context questions:', error)
    return NextResponse.json({ 
      error: 'Failed to generate context questions',
      details: error.message 
    }, { status: 500 })
  }
}
