import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeDependencies } from '@/lib/ai'

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
      // Get tasks due today that have dependencies
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const tasksDueToday = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          dependencies: {
            include: {
              dependency: true,
            },
          },
        },
      })

      for (const task of tasksDueToday) {
        // Check if any dependencies are not completed
        const incompleteDependencies = task.dependencies.filter(
          dep => dep.dependency.status !== 'COMPLETED'
        )

        if (incompleteDependencies.length > 0) {
          // Analyze risks using AI
          const risks = await analyzeDependencies(
            task.id,
            task.title,
            incompleteDependencies.map(dep => dep.dependency.title)
          )

          // Create notification for blocking dependencies
          await prisma.notification.create({
            data: {
              userId: user.id,
              taskId: task.id,
              type: 'DEPENDENCY',
              title: 'Dependency Alert',
              message: `Task "${task.title}" is due today but depends on incomplete tasks: ${incompleteDependencies.map(dep => dep.dependency.title).join(', ')}`,
            },
          })

          // Also check for tasks that depend on this task
          const dependentTasks = await prisma.task.findMany({
            where: {
              userId: user.id,
              dependencies: {
                some: {
                  dependencyId: task.id,
                },
              },
            },
            select: { title: true },
          })

          if (dependentTasks.length > 0) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                taskId: task.id,
                type: 'DEPENDENCY',
                title: 'Cascade Alert',
                message: `Completing "${task.title}" today will unblock ${dependentTasks.length} dependent tasks`,
              },
            })
          }
        }
      }

      // Check for overdue tasks that are blocking others
      const overdueTasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            lt: today,
          },
        },
        include: {
          dependents: {
            include: {
              dependent: true,
            },
          },
        },
      })

      for (const task of overdueTasks) {
        if (task.dependents.length > 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              taskId: task.id,
              type: 'OVERDUE',
              title: 'Overdue Task Blocking Others',
              message: `Overdue task "${task.title}" is blocking ${task.dependents.length} other tasks`,
            },
          })
        }
      }
    }

    return NextResponse.json({ message: 'Dependency check completed successfully' })
  } catch (error) {
    console.error('Error in dependency check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
