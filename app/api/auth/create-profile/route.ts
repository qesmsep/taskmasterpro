import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Creating user profile for:', email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('User already exists:', existingUser.id)
      return NextResponse.json(
        { message: 'User profile already exists' },
        { status: 200 }
      )
    }

    // Create new user profile
    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || 'User'
      }
    })

    console.log('User profile created:', newUser.id)

    return NextResponse.json(
      { 
        message: 'User profile created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating user profile:', error)
    
    // Provide more specific error information
    let errorMessage = 'Failed to create user profile'
    if (error.code === 'P1000') {
      errorMessage = 'Database authentication failed - check your connection string'
    } else if (error.code === 'P1001') {
      errorMessage = 'Database connection failed - check if database is accessible'
    } else if (error.code === 'P2002') {
      errorMessage = 'User with this email already exists'
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
