import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Checking database schema...')

    // Query to get table schema
    const schema = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'tasks' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `

    console.log('Tasks table schema:', schema)

    return NextResponse.json(
      { 
        message: 'Database schema retrieved successfully',
        schema
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error checking schema:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check schema',
        details: error.message
      },
      { status: 500 }
    )
  }
}
