import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const category = await prisma.category.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id
      },
      include: {
        schedules: true,
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, color, description, schedules } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Update category and schedules
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        color: color || '#007AFF',
        description: description?.trim(),
        schedules: {
          deleteMany: {},
          create: schedules?.map((schedule: any) => ({
            dayOfWeek: schedule.dayOfWeek,
            startHour: schedule.startHour,
            endHour: schedule.endHour,
            isActive: schedule.isActive !== false
          })) || []
        }
      },
      include: {
        schedules: true,
        _count: {
          select: { tasks: true }
        }
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email as string }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { 
        id: params.id,
        userId: dbUser.id
      },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Don't allow deletion of default categories or categories with tasks
    if (existingCategory.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default category' }, { status: 400 })
    }

    if (existingCategory._count.tasks > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with existing tasks. Please reassign or delete the tasks first.' 
      }, { status: 400 })
    }

    // Delete category (schedules will be deleted automatically due to cascade)
    await prisma.category.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
