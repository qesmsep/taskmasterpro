import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        subtasks: {
          include: {
            category: true,
            dependencies: true,
            dependents: true,
            subtasks: {
              include: {
                category: true,
                dependencies: true,
                dependents: true,
                subtasks: {
                  include: {
                    category: true,
                    dependencies: true,
                    dependents: true
                  }
                }
              }
            }
          }
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
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, dueDate, priority, status, categoryId, parentId, responsibleParty, tags, estimatedTime, actualTime, isRecurring, recurrenceRule } = body

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

    // Resolve DB user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask || existingTask.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      } else if (status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
        updateData.completedAt = null
      }
    }
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (parentId !== undefined) updateData.parentId = parentId
    if (responsibleParty !== undefined) updateData.responsibleParty = responsibleParty
    if (tags !== undefined) updateData.tags = tags
    if (estimatedTime !== undefined) updateData.estimatedTime = estimatedTime
    if (actualTime !== undefined) updateData.actualTime = actualTime
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring
    if (recurrenceRule !== undefined) updateData.recurrenceRule = recurrenceRule

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        subtasks: {
          include: {
            category: true,
            dependencies: true,
            dependents: true,
            subtasks: {
              include: {
                category: true,
                dependencies: true,
                dependents: true,
                subtasks: {
                  include: {
                    category: true,
                    dependencies: true,
                    dependents: true
                  }
                }
              }
            }
          }
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
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Resolve DB user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
    })

    if (!existingTask || existingTask.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task and all related data (cascade)
    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
