'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Calendar, 
  Clock, 
  Tag,
  Edit,
  Trash2,
  Settings,
  Filter
} from 'lucide-react'
import { formatDate, getPriorityColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import CategorySettings from '@/components/CategorySettings'

interface Category {
  id: string
  name: string
  color: string
  description?: string
  isDefault: boolean
  schedules: Array<{
    id: string
    dayOfWeek: number
    startHour: number
    endHour: number
    isActive: boolean
  }>
  _count: {
    tasks: number
  }
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  estimatedTime?: number
  category?: {
    name: string
    color: string
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchTasks()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTasksByCategory = (categoryId: string) => {
    return tasks.filter(task => task.category?.name === categories.find(c => c.id === categoryId)?.name)
  }

  const getTasksByStatus = (categoryId: string, status: string) => {
    return getTasksByCategory(categoryId).filter(task => task.status === status)
  }

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-apple-gray-900">Categories</h1>
          <p className="text-apple-gray-600 mt-1">
            Organize your tasks by category and manage your workflow
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </Button>
          <Button onClick={() => setShowSettings(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map(category => (
          <Card key={category.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {category.isDefault && (
                    <span className="px-2 py-1 bg-apple-blue/10 text-apple-blue text-xs rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Task Statistics */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-apple-blue">
                      {getTasksByCategory(category.id).length}
                    </div>
                    <div className="text-sm text-apple-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-apple-green">
                      {getTasksByStatus(category.id, 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-apple-gray-600">Done</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-apple-orange">
                      {getTasksByCategory(category.id).filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length}
                    </div>
                    <div className="text-sm text-apple-gray-600">Active</div>
                  </div>
                </div>

                {/* Schedule Info */}
                {category.schedules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-apple-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Working Schedule</span>
                    </div>
                    {category.schedules.slice(0, 2).map((schedule, index) => (
                      <div key={index} className="text-xs text-apple-gray-500">
                        {DAYS_OF_WEEK[schedule.dayOfWeek]} • {formatTime(schedule.startHour)} - {formatTime(schedule.endHour)}
                      </div>
                    ))}
                    {category.schedules.length > 2 && (
                      <div className="text-xs text-apple-gray-500">
                        +{category.schedules.length - 2} more
                      </div>
                    )}
                  </div>
                )}

                {/* Recent Tasks */}
                {selectedCategory === category.id && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-apple-gray-700">Recent Tasks</div>
                    {getTasksByCategory(category.id).slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-apple-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="flex items-center gap-2 text-xs text-apple-gray-500">
                            <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getTasksByCategory(category.id).length > 3 && (
                      <div className="text-xs text-apple-gray-500 text-center">
                        +{getTasksByCategory(category.id).length - 3} more tasks
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Category Settings</h2>
              <Button variant="ghost" onClick={() => setShowSettings(false)}>
                ✕
              </Button>
            </div>
            <CategorySettings />
          </div>
        </div>
      )}
    </div>
  )
}
