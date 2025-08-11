import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDailyAssessment } from '@/lib/ai'

// Force dynamic rendering for cron routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users
    const users = await prisma.user.findMany()

    for (const user of users) {
      // Get yesterday's completed tasks
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const completedTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: 'COMPLETED',
          completedAt: {
            gte: yesterday,
            lt: today,
          },
        },
        select: { title: true },
      })

      // Get pending tasks
      const pendingTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
        },
        select: { title: true },
      })

      // Get overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            lt: today,
          },
        },
        select: { title: true },
      })

      // Generate AI assessment
      const assessment = await generateDailyAssessment(
        completedTasks.map(t => t.title),
        pendingTasks.map(t => t.title),
        overdueTasks.map(t => t.title)
      )

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'REMINDER',
          title: 'Daily Task Assessment',
          message: `Today's plan: ${assessment.todayPlan.join(', ')}. Quick wins: ${assessment.quickWins.join(', ')}`,
        },
      })

      // Store assessment in database for later retrieval
      await prisma.communication.create({
        data: {
          userId: user.id,
          type: 'NOTE',
          content: JSON.stringify(assessment),
          subject: 'Daily AI Assessment',
        },
      })
    }

    return NextResponse.json({ message: 'Daily assessment completed successfully' })
  } catch (error) {
    console.error('Error in daily assessment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
