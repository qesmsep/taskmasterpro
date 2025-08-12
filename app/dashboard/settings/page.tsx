'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Settings, 
  User, 
  Bell, 
  Calendar,
  Palette,
  Shield,
  Database,
  LogOut
} from 'lucide-react'
import CategorySettings from '@/components/CategorySettings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('categories')

  const tabs = [
    { id: 'categories', label: 'Categories', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Export', icon: Database },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategorySettings />
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Profile settings coming soon...</p>
            </CardContent>
          </Card>
        )
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Notification settings coming soon...</p>
            </CardContent>
          </Card>
        )
      case 'calendar':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Connect your calendar accounts for smart scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Calendar integration coming soon...</p>
            </CardContent>
          </Card>
        )
      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Appearance settings coming soon...</p>
            </CardContent>
          </Card>
        )
      case 'security':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Security settings coming soon...</p>
            </CardContent>
          </Card>
        )
      case 'data':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Data & Export</CardTitle>
              <CardDescription>
                Export your data and manage your information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Data export features coming soon...</p>
            </CardContent>
          </Card>
        )
      default:
        return <CategorySettings />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-apple-gray-900">Settings</h1>
        <p className="text-apple-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-apple-blue text-white'
                          : 'text-apple-gray-700 hover:bg-apple-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
