'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const email = searchParams.get('email')
    
    if (!email) {
      setStatus('error')
      setMessage('Invalid confirmation link. Please try signing up again.')
      return
    }

    // Simulate email confirmation process
    // In a real app, you would verify the email with your backend
    const confirmEmail = async () => {
      try {
        // For now, we'll just simulate a successful confirmation
        // You can add actual email verification logic here later
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
        
        setStatus('success')
        setMessage('Your email has been confirmed successfully!')
        
        // Redirect to sign-in page after 3 seconds
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      } catch (error) {
        setStatus('error')
        setMessage('Failed to confirm your email. Please try again.')
      }
    }

    confirmEmail()
  }, [searchParams, router])

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
          <h1 className="text-2xl font-bold text-apple-gray-900">Confirm Your Email</h1>
          <p className="text-apple-gray-600 mt-2">
            We're verifying your email address
          </p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-apple-blue"></div>
              )}
              {status === 'success' && (
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              )}
              {status === 'error' && (
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
              )}
              {status === 'loading' && 'Confirming...'}
              {status === 'success' && 'Email Confirmed!'}
              {status === 'error' && 'Confirmation Failed'}
            </CardTitle>
            <CardDescription className="text-center">
              {status === 'loading' && 'Please wait while we verify your email address...'}
              {status === 'success' && 'You will be redirected to sign in shortly'}
              {status === 'error' && 'Something went wrong with the confirmation'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-apple-gray-600">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="text-center">
                <p className="text-sm text-apple-gray-500 mb-4">
                  Redirecting to sign in page...
                </p>
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  Sign In Now
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center space-y-4">
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  className="w-full"
                >
                  Try Signing Up Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
