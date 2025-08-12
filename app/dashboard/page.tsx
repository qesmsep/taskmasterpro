'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  MoreHorizontal,
  Brain,
  Tag,
  User
} from 'lucide-react'
import TaskCreationWizard from '@/components/TaskCreationWizard'
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

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
  responsibleParty?: string
  subtasks: Task[]
  completedAt?: string
  aiSuggestions?: {
    suggestions?: string[]
    selectedSuggestions?: Array<{
      suggestion: string
      feedback: string
    }>
    estimatedDuration?: number
    complexity?: string
  }
  successCriteria?: string
  _count?: {
    subtasks: number
  }
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [showTaskWizard, setShowTaskWizard] = useState(false)

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

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    if (!supabase) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tasks')
      }

      const data = await response.json()
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim() || !supabase) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: newTaskTitle,
          status: 'TODO',
          priority: 'MEDIUM'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const data = await response.json()
      setTasks([...tasks, data])
      setNewTaskTitle('')
      setShowNewTaskDialog(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!supabase) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update task')
      }

      const updated = await response.json()
      setTasks(tasks.map(t => t.id === taskId ? updated : t))
    } catch (e) {
      console.error('Error updating task:', e)
    }
  }

  const getTodayTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= today && dueDate < tomorrow
    })
  }

  const getOverdueTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate < today && task.status !== 'COMPLETED'
    })
  }

  const getUpcomingTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return dueDate >= nextWeek && task.status !== 'COMPLETED'
    })
  }

  const getNoDateTasks = () => {
    return tasks.filter(task => !task.dueDate && task.status !== 'COMPLETED')
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={`task-card hover:shadow-md transition-all duration-200 ${task.status === 'COMPLETED' ? 'bg-apple-gray-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => updateTaskStatus(task.id, task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}
                className="flex-shrink-0"
              >
                <CheckCircle 
                  className={`h-5 w-5 ${task.status === 'COMPLETED' ? 'text-apple-green' : 'text-apple-gray-300'}`} 
                />
              </button>
                                      <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-apple-gray-500' : 'text-apple-gray-900'}`}>
                          <a 
                            href={`/dashboard/projects/${task.id}`}
                            className="hover:text-apple-blue transition-colors"
                          >
                            {task.title}
                          </a>
                        </h3>
            </div>
            
            {/* AI Suggestions */}
            {task.aiSuggestions?.selectedSuggestions && task.aiSuggestions.selectedSuggestions.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-apple-blue" />
                  <span className="text-sm font-medium text-apple-gray-700">AI Suggestions</span>
                </div>
                <div className="space-y-1">
                  {task.aiSuggestions.selectedSuggestions.map((item, index) => (
                    <div key={index} className="text-sm text-apple-gray-600 bg-apple-blue/5 rounded-lg p-2">
                      <div className="font-medium">{item.suggestion}</div>
                      {item.feedback && (
                        <div className="text-xs text-apple-gray-500 mt-1">{item.feedback}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            {task.successCriteria && (
              <div className="mb-3">
                <div className="text-sm font-medium text-apple-gray-700 mb-1">Success Criteria</div>
                <p className="text-sm text-apple-gray-600 bg-apple-green/5 rounded-lg p-2">
                  {task.successCriteria}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-apple-gray-500">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Due {formatDate(task.dueDate)}
                </div>
              )}
              
              {task.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(task.estimatedTime / 60)}h {task.estimatedTime % 60}m
                </div>
              )}

              {task.category && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ backgroundColor: `${task.category.color}20`, color: task.category.color }}
                  >
                    {task.category.name}
                  </span>
                </div>
              )}

              {task.responsibleParty && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {task.responsibleParty}
                </div>
              )}
            </div>

            {/* Tasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-apple-gray-700">
                    Tasks ({task.subtasks.filter(st => st.status === 'COMPLETED').length}/{task.subtasks.length})
                  </div>
                </div>
                <div className="space-y-1">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 pl-4">
                      <button
                        onClick={() => updateTaskStatus(subtask.id, subtask.status === 'COMPLETED' ? 'TODO' : 'COMPLETED')}
                        className="flex-shrink-0"
                      >
                        <CheckCircle 
                          className={`h-4 w-4 ${subtask.status === 'COMPLETED' ? 'text-apple-green' : 'text-apple-gray-300'}`} 
                        />
                      </button>
                      <span className={`text-sm flex-1 ${subtask.status === 'COMPLETED' ? 'line-through text-apple-gray-400' : 'text-apple-gray-700'}`}>
                        {subtask.title}
                      </span>
                      {subtask.estimatedTime && (
                        <span className="text-xs text-apple-gray-500">
                          {Math.floor(subtask.estimatedTime / 60)}h {subtask.estimatedTime % 60}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-apple-gray-900">Today</h1>
          <p className="text-apple-gray-600 mt-1">
            {formatDate(new Date())} • {tasks.filter(t => t.status === 'COMPLETED').length} of {tasks.length} projects complete
          </p>
        </div>
        
        <Button onClick={() => setShowTaskWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Quick Add */}
      <Card className="border-dashed border-2 border-apple-gray-200 hover:border-apple-blue transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Plus className="h-5 w-5 text-apple-gray-400" />
            <Input
              placeholder="Quick add a task..."
              className="border-0 shadow-none text-lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setNewTaskTitle(e.currentTarget.value)
                  setShowNewTaskDialog(true)
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      {getOverdueTasks().length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-apple-red" />
            <h2 className="text-xl font-semibold text-apple-gray-900">Overdue</h2>
          </div>
          <div className="grid gap-4">
            {getOverdueTasks().map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-apple-gray-900 mb-4">Today</h2>
        {getTodayTasks().length > 0 ? (
          <div className="grid gap-4">
            {getTodayTasks().map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-apple-gray-200">
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-apple-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-apple-gray-900 mb-2">No tasks for today</h3>
              <p className="text-apple-gray-600 mb-4">
                You're all caught up! Add a new task to get started.
              </p>
              <Button onClick={() => setShowNewTaskDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Backlog (No Due Date) */}
      {getNoDateTasks().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-apple-gray-900 mb-4">Backlog</h2>
          <div className="grid gap-4">
            {getNoDateTasks().map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
      {/* Upcoming Tasks */}
      {getUpcomingTasks().length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-apple-gray-900 mb-4">Upcoming</h2>
          <div className="grid gap-4">
            {getUpcomingTasks().slice(0, 5).map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <Card className="bg-gradient-to-r from-apple-blue/5 to-apple-purple/5 border-apple-blue/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-apple-blue/10 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-apple-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-apple-gray-900">AI Insights</h3>
              <p className="text-sm text-apple-gray-600">Daily productivity recommendations</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-apple-gray-700">
            <p>• You have {getOverdueTasks().length} overdue tasks that need attention</p>
            <p>• Consider breaking down larger tasks into smaller subtasks</p>
            <p>• You're on track to complete {tasks.length ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0}% of your tasks this week</p>
          </div>
        </CardContent>
      </Card>

      {/* Task Creation Wizard */}
      <TaskCreationWizard
        isOpen={showTaskWizard}
        onClose={() => setShowTaskWizard(false)}
        onTaskCreated={(task) => {
          setTasks([...tasks, task])
          setShowTaskWizard(false)
        }}
      />
    </div>
  )
}
