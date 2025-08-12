import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Checking database enum types...')

    // Query to get all enum types
    const enums = await prisma.$queryRaw`
      SELECT t.typname AS enum_name, 
             array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname;
    `

    console.log('Found enum types:', enums)

    return NextResponse.json(
      { 
        message: 'Database enum types retrieved successfully',
        enums
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error checking enum types:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check enum types',
        details: error.message
      },
      { status: 500 }
    )
  }
}
