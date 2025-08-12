import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, 
  Calendar, 
  FileText, 
  Mail, 
  Shield, 
  Sparkles, 
  Target, 
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-50 to-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-apple-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-apple-gray-900">
                TaskMasterPro
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center rounded-full bg-apple-blue/10 px-4 py-2 text-sm font-medium text-apple-blue">
                <Sparkles className="mr-2 h-4 w-4" />
                AI-Powered Task Management
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-apple-gray-900 mb-6">
              Your Task Brain,
              <span className="text-apple-blue"> Amplified</span>
            </h1>
            
            <p className="text-xl text-apple-gray-600 mb-8 max-w-3xl mx-auto">
              An everyday, due-date-driven task system that expands fuzzy ideas into crisp plans, 
              guards your schedule with dependency-aware alerts, and keeps everything organized.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/signin">
                  Sign In
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/demo">
                  Watch Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-apple-gray-900 mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-lg text-apple-gray-600 max-w-2xl mx-auto">
              From quick task capture to AI-powered planning, TaskMasterPro has everything 
              you need to turn ideas into action.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-blue/10 rounded-2xl flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-apple-blue" />
                </div>
                <CardTitle>AI Task Expansion</CardTitle>
                <CardDescription>
                  Transform vague tasks into actionable subtasks with AI assistance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-green/10 rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-apple-green" />
                </div>
                <CardTitle>Smart Scheduling</CardTitle>
                <CardDescription>
                  Due-date-driven prioritization with dependency-aware alerts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-orange/10 rounded-2xl flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-apple-orange" />
                </div>
                <CardTitle>Integrated Communication</CardTitle>
                <CardDescription>
                  Send emails and track conversations directly within tasks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-purple/10 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-apple-purple" />
                </div>
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  Attach files and notes that automatically propagate to parent tasks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-red/10 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-apple-red" />
                </div>
                <CardTitle>Risk Alerts</CardTitle>
                <CardDescription>
                  Get notified only when due dates and dependencies matter
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-apple-pink/10 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-apple-pink" />
                </div>
                <CardTitle>Recurring Tasks</CardTitle>
                <CardDescription>
                  Set up flexible recurring patterns with inherited properties
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-apple-blue">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your productivity?
          </h2>
          <p className="text-xl text-apple-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have already streamlined their task management 
            with AI-powered insights and smart automation.
          </p>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/auth/signup">
              Start Your Free Trial
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-apple-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">TaskMasterPro</h3>
              <p className="text-apple-gray-400">
                Your AI-powered task management companion
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-2 text-apple-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-apple-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-apple-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-apple-gray-800 mt-8 pt-8 text-center text-apple-gray-400">
            <p>&copy; 2024 TaskMasterPro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
