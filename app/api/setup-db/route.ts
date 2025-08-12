import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Setting up database enums...')

    // Create the missing enum types
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "CommunicationType" AS ENUM ('EMAIL', 'SMS', 'SLACK', 'TEAMS', 'OTHER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "NotificationType" AS ENUM ('TASK_DUE', 'TASK_OVERDUE', 'TASK_ASSIGNED', 'TASK_COMPLETED', 'SYSTEM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    console.log('Database enums created successfully')

    return NextResponse.json(
      { 
        message: 'Database enums created successfully'
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error setting up database enums:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to set up database enums',
        details: error.message
      },
      { status: 500 }
    )
  }
}
