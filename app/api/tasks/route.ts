import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const parentId = searchParams.get('parentId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const where: any = { userId }

    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId
    if (parentId === 'null') {
      where.parentId = null
    } else if (parentId) {
      where.parentId = parentId
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
    const { title, description, dueDate, priority, categoryId, parentId, responsibleParty, tags, estimatedTime, isRecurring, recurrenceRule } = body

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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: 'TODO',
        categoryId,
        parentId,
        responsibleParty,
        tags: tags || [],
        estimatedTime,
        isRecurring: isRecurring || false,
        recurrenceRule,
        nextOccurrence: isRecurring && recurrenceRule ? new Date() : null,
        userId: user.id,
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
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
