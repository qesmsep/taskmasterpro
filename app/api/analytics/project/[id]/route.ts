import { NextRequest, NextResponse } from 'next/server'
import { analyzeProjectIntelligence, generateProjectInsights } from '@/lib/ai'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { projectData } = await request.json()
    const projectId = params.id

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

    // Fetch project and tasks from database
    const project = await prisma.task.findUnique({
      where: { id: projectId, userId: user.id },
      include: {
        subtasks: {
          include: {
            category: true,
            dependencies: true,
            dependents: true
          }
        },
        category: true,
        dependencies: true,
        dependents: true
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get category schedules
    const categorySchedules = await prisma.categorySchedule.findMany({
      where: { categoryId: project.categoryId || '' }
    })

    // Get calendar events (placeholder for future integration)
    const calendarEvents: any[] = []

    // Prepare data for AI analysis
    const tasksForAnalysis = project.subtasks.map(task => ({
      title: task.title,
      estimatedTime: task.estimatedTime || 0,
      priority: task.priority,
      dependencies: task.dependencies.map(dep => dep.dependencyId)
    }))

    // Generate AI insights
    const [intelligence, insights] = await Promise.all([
      analyzeProjectIntelligence({
        title: project.title,
        tasks: tasksForAnalysis,
        dueDate: project.dueDate?.toISOString() || '',
        categorySchedules: categorySchedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          startHour: schedule.startHour,
          endHour: schedule.endHour
        })),
        calendarEvents
      }),
      generateProjectInsights(projectId, project.subtasks)
    ])

    // Calculate completion metrics
    const totalTasks = project.subtasks.length
    const completedTasks = project.subtasks.filter(t => t.status === 'COMPLETED').length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Calculate time efficiency
    const totalEstimated = project.subtasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
    const totalActual = project.subtasks.reduce((sum, task) => sum + (task.actualTime || 0), 0)
    const timeEfficiency = totalEstimated > 0 ? Math.round((totalEstimated / Math.max(totalActual, 1)) * 100) : 100

    // Calculate days remaining
    const daysRemaining = project.dueDate 
      ? Math.max(0, Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0

    // Determine risk level
    const highRiskTasks = project.subtasks.filter(task => 
      task.priority === 'URGENT' && task.status !== 'COMPLETED'
    ).length
    const riskLevel = highRiskTasks > 2 ? 'High' : highRiskTasks > 0 ? 'Medium' : 'Low'

    // Prepare response
    const analytics = {
      completionRate,
      timeEfficiency,
      riskLevel,
      daysRemaining,
      optimizedSchedule: intelligence.optimizedSchedule,
      criticalPath: intelligence.criticalPath,
      riskAssessment: intelligence.riskAssessment,
      efficiencySuggestions: intelligence.efficiencySuggestions,
      timeOptimization: intelligence.timeOptimization,
      productivityPatterns: insights.productivityPatterns,
      completionTrends: insights.completionTrends
    }

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Error generating project analytics:', error)
    return NextResponse.json({ 
      error: 'Failed to generate project analytics',
      details: error.message 
    }, { status: 500 })
  }
}
