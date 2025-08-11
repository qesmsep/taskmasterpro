'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  _count?: {
    subtasks: number
  }
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(name, color),
          subtasks: tasks(*)
        `)
        .eq('userId', user.id)
        .is('parentId', null)
        .order('dueDate', { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            title: newTaskTitle,
            userId: user.id,
            status: 'TODO',
            priority: 'MEDIUM'
          }
        ])
        .select()
        .single()

      if (error) throw error

      setTasks([...tasks, data])
      setNewTaskTitle('')
      setShowNewTaskDialog(false)
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          completedAt: status === 'COMPLETED' ? new Date().toISOString() : null
        })
        .eq('id', taskId)

      if (error) throw error

      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : null }
          : task
      ))
    } catch (error) {
      console.error('Error updating task:', error)
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

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="task-card hover:shadow-md transition-all duration-200">
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
                {task.title}
              </h3>
            </div>
            
            {task.description && (
              <p className="text-sm text-apple-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-apple-gray-500">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(task.dueDate)}
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

            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-3 text-sm text-apple-gray-500">
                {task.subtasks.filter(st => st.status === 'COMPLETED').length} of {task.subtasks.length} subtasks complete
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
            {formatDate(new Date())} • {tasks.filter(t => t.status === 'COMPLETED').length} of {tasks.length} tasks complete
          </p>
        </div>
        
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Task Title
                </label>
                <Input
                  placeholder="What needs to be done?"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createTask()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            <p>• You're on track to complete {Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)}% of your tasks this week</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
