'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Edit, 
  Share, 
  Download,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ProjectHierarchy from '@/components/ProjectHierarchy'
import ProjectAnalytics from '@/components/ProjectAnalytics'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  estimatedTime?: number
  actualTime?: number
  subtasks?: Task[]
  dependencies?: string[]
  responsibleParty?: string
  category?: {
    name: string
    color: string
  }
  suggestedStartDate?: string
  suggestedEndDate?: string
  isBlocked?: boolean
  blockingReason?: string
}

interface Project {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string
  estimatedTime?: number
  actualTime?: number
  category?: {
    name: string
    color: string
  }
  responsibleParty?: string
  successCriteria?: string
  aiSuggestions?: any
  subtasks: Task[]
  createdAt: string
  updatedAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'analytics' | 'timeline'>('overview')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/tasks/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const projectData = await response.json()
        setProject(projectData)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh project data
        fetchProject()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleTaskStart = (taskId: string) => {
    updateTaskStatus(taskId, 'IN_PROGRESS')
  }

  const handleTaskPause = (taskId: string) => {
    updateTaskStatus(taskId, 'TODO')
  }

  const handleTaskComplete = (taskId: string) => {
    updateTaskStatus(taskId, 'COMPLETED')
  }

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    // Implementation for updating task details
    console.log('Update task:', taskId, updates)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700'
      case 'HIGH': return 'bg-orange-100 text-orange-700'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700'
      case 'LOW': return 'bg-green-100 text-green-700'
      default: return 'bg-apple-gray-100 text-apple-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-apple-green'
      case 'IN_PROGRESS': return 'text-apple-blue'
      case 'CANCELLED': return 'text-red-500'
      default: return 'text-apple-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
        <span className="ml-2">Loading project...</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-apple-gray-600">Project not found</p>
      </div>
    )
  }

  const completedTasks = project.subtasks.filter(t => t.status === 'COMPLETED').length
  const totalTasks = project.subtasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-apple-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-apple-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-apple-gray-900">{project.title}</h1>
                <p className="text-sm text-apple-gray-600">
                  Created {formatDate(project.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-apple-gray-600">{project.description}</p>
                )}
                
                {project.successCriteria && (
                  <div>
                    <h4 className="font-medium text-apple-gray-900 mb-2">Success Criteria</h4>
                    <p className="text-sm text-apple-gray-600 bg-apple-green/5 rounded-lg p-3">
                      {project.successCriteria}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-apple-green">{completionRate}%</p>
                    <p className="text-sm text-apple-gray-600">Complete</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-apple-blue">{totalTasks}</p>
                    <p className="text-sm text-apple-gray-600">Total Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500">
                      {project.subtasks.filter(t => t.status === 'IN_PROGRESS').length}
                    </p>
                    <p className="text-sm text-apple-gray-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-apple-gray-900">
                      {formatTime(project.estimatedTime)}
                    </p>
                    <p className="text-sm text-apple-gray-600">Estimated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-apple-gray-500" />
                  <span className="text-sm text-apple-gray-600">Due Date</span>
                  <span className="text-sm font-medium">{formatDate(project.dueDate)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-apple-gray-500" />
                  <span className="text-sm text-apple-gray-600">Estimated Time</span>
                  <span className="text-sm font-medium">{formatTime(project.estimatedTime)}</span>
                </div>
                
                {project.responsibleParty && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-apple-gray-500" />
                    <span className="text-sm text-apple-gray-600">Responsible</span>
                    <span className="text-sm font-medium">{project.responsibleParty}</span>
                  </div>
                )}
                
                {project.category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-apple-gray-500" />
                    <span className="text-sm text-apple-gray-600">Category</span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${project.category.color}20`, color: project.category.color }}
                    >
                      {project.category.name}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-apple-gray-500" />
                  <span className="text-sm text-apple-gray-600">Status</span>
                  <span className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-apple-gray-500" />
                  <span className="text-sm text-apple-gray-600">Priority</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Review
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Assign Tasks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-apple-gray-100 rounded-lg p-1 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: CheckCircle },
            { id: 'tasks', label: 'Tasks', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'timeline', label: 'Timeline', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-apple-blue shadow-sm'
                    : 'text-apple-gray-600 hover:text-apple-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* AI Suggestions */}
            {project.aiSuggestions?.suggestions && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {project.aiSuggestions.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-apple-blue/5 rounded-lg">
                        <div className="w-2 h-2 bg-apple-blue rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-apple-green rounded-full"></div>
                    <p className="text-sm text-apple-gray-600">
                      Project created on {formatDate(project.createdAt)}
                    </p>
                  </div>
                  {project.subtasks.filter(t => t.status === 'COMPLETED').slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-apple-blue rounded-full"></div>
                      <p className="text-sm text-apple-gray-600">
                        Task "{task.title}" completed
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <ProjectHierarchy
            projectId={project.id}
            tasks={project.subtasks}
            onTaskUpdate={handleTaskUpdate}
            onTaskStart={handleTaskStart}
            onTaskPause={handleTaskPause}
            onTaskComplete={handleTaskComplete}
          />
        )}

        {activeTab === 'analytics' && (
          <ProjectAnalytics
            projectId={project.id}
            projectData={project}
          />
        )}

        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-apple-gray-600">Timeline view coming soon...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
