import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaskMasterPro - Your AI-Powered Task Management System',
  description: 'An everyday, due-date-driven task brain that expands fuzzy ideas into crisp plans, guards your schedule with dependency-aware alerts, and keeps comms/files glued to the work.',
  keywords: 'task management, AI, productivity, project management, due dates, dependencies',
  authors: [{ name: 'TaskMasterPro Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#007AFF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-apple-gray-50 antialiased`}>
        <div className="min-h-full">
          {children}
        </div>
      </body>
    </html>
  )
}
