'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, ArrowLeft } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const router = useRouter()

  // Check if Supabase is available
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-apple-gray-900 mb-4">Configuration Error</h1>
          <p className="text-apple-gray-600">
            Supabase configuration is missing. Please check your environment variables.
          </p>
        </div>
      </div>
    )
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!supabase) {
      setError('Supabase client not initialized')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting sign up for:', email)
      
      // Step 1: Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        throw error
      }

      console.log('Sign up response:', data)

      if (data.user) {
        console.log('User created successfully:', data.user.email)
        
        // Step 2: Create user profile in our database
        try {
          const profileResponse = await fetch('/api/auth/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name,
            }),
          })

          if (!profileResponse.ok) {
            const errorData = await profileResponse.json()
            console.warn('Failed to create user profile:', errorData)
          } else {
            console.log('User profile created successfully')
          }
        } catch (profileError) {
          console.warn('Profile creation failed:', profileError)
        }

        // Step 3: Send custom confirmation email
        try {
          const emailResponse = await fetch('/api/auth/send-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              name,
            }),
          })

          if (!emailResponse.ok) {
            const errorData = await emailResponse.json()
            console.warn('Failed to send confirmation email:', errorData)
          } else {
            console.log('Confirmation email sent successfully')
          }
        } catch (emailError) {
          console.warn('Email sending failed:', emailError)
        }

        // Step 4: Show confirmation message
        setSignupEmail(email)
        setShowConfirmation(true)
      } else if (data.session) {
        console.log('User already has session, redirecting to dashboard')
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Sign up failed:', error)
      
      // Provide more user-friendly error messages
      let errorMessage = error.message
      if (error.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many sign-up attempts. Please wait a moment and try again.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setResendLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/send-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: signupEmail,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send confirmation email')
      }

      alert('Confirmation email sent! Please check your inbox.')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setResendLoading(false)
    }
  }

  // Show confirmation message after successful signup
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link 
              href="/" 
              className="inline-flex items-center text-apple-gray-600 hover:text-apple-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
            <h1 className="text-2xl font-bold text-apple-gray-900">Check your email</h1>
            <p className="text-apple-gray-600 mt-2">
              We've sent a confirmation link to your email address
            </p>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-center">🎉 Account Created!</CardTitle>
              <CardDescription className="text-center">
                Please confirm your email address to complete your registration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-apple-gray-600 mb-4">
                  We've sent a confirmation email to:
                </p>
                <p className="font-medium text-apple-gray-900">{signupEmail}</p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? 'Sending...' : 'Resend confirmation email'}
                </Button>

                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  Go to sign in
                </Button>
              </div>

              {error && (
                <div className="text-apple-red text-sm bg-apple-red/10 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="text-center text-sm text-apple-gray-500">
                <p>Didn't receive the email?</p>
                <p>Check your spam folder or try resending the confirmation.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-apple-gray-600 hover:text-apple-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold text-apple-gray-900">Create your account</h1>
          <p className="text-apple-gray-600 mt-2">
            Start organizing your tasks with AI-powered insights
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="text-apple-red text-sm bg-apple-red/10 p-3 rounded-xl">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-apple-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-apple-blue hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
