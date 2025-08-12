import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const parentId = searchParams.get('parentId')
    const type = searchParams.get('type')

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

    // Get database user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const where: any = { userId: dbUser.id }

    // If type=projects, return only parent tasks (projects)
    if (type === 'projects') {
      where.parentId = null
    } else {
      if (status) where.status = status
      if (categoryId) where.categoryId = categoryId
      if (parentId === 'null') {
        where.parentId = null
      } else if (parentId) {
        where.parentId = parentId
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        category: true,
        subtasks: {
          include: {
            category: true,
          },
        },
        dependencies: {
          include: {
            dependency: true,
          },
        },
        dependents: {
          include: {
            dependent: true,
          },
        },
        attachments: true,
        communications: true,
        timeBlocks: true,
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, dueDate, priority, categoryId, parentId, responsibleParty, tags, estimatedTime, isRecurring, recurrenceRule, successCriteria, aiSuggestions, selectedSuggestions, subtasks } = body

    // --- Validation and normalization ---
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
    const normalizedPriority = (priority && allowedPriorities.includes(priority)) ? priority : 'MEDIUM'

    const cleanedTags = Array.isArray(tags) ? tags.filter(t => typeof t === 'string') : []

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

    // Get or create database user by email
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email as string }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email as string,
          name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
          avatar: (user.user_metadata?.avatar_url as string) || null,
        },
      })
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: normalizedPriority,
        status: 'TODO',
        categoryId,
        parentId,
        responsibleParty,
        tags: cleanedTags,
        estimatedTime,
        isRecurring: isRecurring || false,
        recurrenceRule,
        nextOccurrence: isRecurring && recurrenceRule ? new Date() : null,
        successCriteria,
        aiSuggestions: {
          ...aiSuggestions,
          selectedSuggestions
        },
        userId: dbUser.id,
        subtasks: subtasks ? {
          create: subtasks.map((subtask: any) => ({
            title: subtask.title,
            description: subtask.description,
            dueDate: subtask.suggestedDueDate ? new Date(subtask.suggestedDueDate) : null,
            estimatedTime: subtask.estimatedTime,
            priority: subtask.priority === 'high' ? 'HIGH' : subtask.priority === 'medium' ? 'MEDIUM' : 'LOW',
            status: 'TODO',
            userId: dbUser.id,
          }))
        } : undefined,
      },
      include: {
        category: true,
        subtasks: true,
        dependencies: true,
        dependents: true,
        attachments: true,
        communications: true,
        timeBlocks: true,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    const payload: any = { error: 'Internal server error' }
    if (process.env.NODE_ENV !== 'production') {
      payload.details = error?.message
      if (error?.code) payload.code = error.code
      if (error?.meta) payload.meta = error.meta
      if (error?.stack) payload.stack = error.stack
    }
    return NextResponse.json(payload, { status: 500 })
  }
}
