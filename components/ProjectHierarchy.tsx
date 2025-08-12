'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Users,
  Tag,
  ArrowRight,
  Play,
  Pause,
  Square,
  Brain,
  MessageSquare
} from 'lucide-react'

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
  level?: number // Track nesting level
}

interface ProjectHierarchyProps {
  projectId: string
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskStart: (taskId: string) => void
  onTaskPause: (taskId: string) => void
  onTaskComplete: (taskId: string) => void
}

export default function ProjectHierarchy({ 
  projectId, 
  tasks, 
  onTaskUpdate, 
  onTaskStart, 
  onTaskPause, 
  onTaskComplete 
}: ProjectHierarchyProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'hierarchy' | 'timeline' | 'kanban'>('hierarchy')
  const [assistanceDialogOpen, setAssistanceDialogOpen] = useState(false)
  const [selectedTaskForAssistance, setSelectedTaskForAssistance] = useState<Task | null>(null)
  const [userQuery, setUserQuery] = useState('')
  const [assistance, setAssistance] = useState<any>(null)
  const [loadingAssistance, setLoadingAssistance] = useState(false)

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-apple-green'
      case 'IN_PROGRESS': return 'text-apple-blue'
      case 'CANCELLED': return 'text-red-500'
      default: return 'text-apple-gray-400'
    }
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

  const formatTime = (minutes?: number) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCompletionRate = (tasks: Task[]) => {
    const calculateNestedCompletion = (taskList: Task[]): { total: number; completed: number } => {
      let total = 0
      let completed = 0
      
      for (const task of taskList) {
        total++
        if (task.status === 'COMPLETED') {
          completed++
        }
        
        if (task.subtasks && task.subtasks.length > 0) {
          const nested = calculateNestedCompletion(task.subtasks)
          total += nested.total
          completed += nested.completed
        }
      }
      
      return { total, completed }
    }
    
    const { total, completed } = calculateNestedCompletion(tasks)
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const openTaskAssistance = (task: Task) => {
    setSelectedTaskForAssistance(task)
    setUserQuery('')
    setAssistance(null)
    setAssistanceDialogOpen(true)
  }

  const getTaskAssistance = async () => {
    if (!selectedTaskForAssistance || !userQuery.trim()) return

    setLoadingAssistance(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ai/task-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          taskTitle: selectedTaskForAssistance.title,
          taskDescription: selectedTaskForAssistance.description || '',
          userQuery: userQuery,
          projectContext: `Project with ${tasks.length} main tasks`
        })
      })

      if (response.ok) {
        const assistanceData = await response.json()
        setAssistance(assistanceData)
      }
    } catch (error) {
      console.error('Error getting task assistance:', error)
    } finally {
      setLoadingAssistance(false)
    }
  }

  const renderTaskCard = (task: Task, level: number = 0) => {
    const isExpanded = expandedTasks.has(task.id)
    const hasSubtasks = task.subtasks && task.subtasks.length > 0
    const isBlocked = task.isBlocked || (task.dependencies && task.dependencies.length > 0)
    
    // Set the level for this task
    const taskWithLevel = { ...task, level }

    return (
      <div key={task.id} className="space-y-1">
        <div className="flex items-start gap-2" style={{ marginLeft: `${level * 24}px` }}>
          {/* Bullet point and expand/collapse */}
          <div className="flex items-center gap-2 mt-4">
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="p-1 hover:bg-apple-gray-100 rounded transition-colors"
              >
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                />
              </button>
            ) : (
              <div className="w-6 h-4 flex items-center justify-center">
                <div className="w-1 h-1 bg-apple-gray-400 rounded-full"></div>
              </div>
            )}
            
            {/* Bullet point */}
            <div className="w-2 h-2 rounded-full" style={{
              backgroundColor: level === 0 ? '#007AFF' : level === 1 ? '#34C759' : level === 2 ? '#FF9500' : '#FF3B30'
            }}></div>
          </div>

          {/* Task content */}
          <Card className={`flex-1 transition-all duration-200 hover:shadow-md ${
            selectedTask === task.id ? 'ring-2 ring-apple-blue' : ''
          } ${task.status === 'COMPLETED' ? 'bg-apple-gray-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
              {/* Expand/Collapse Button */}
              {hasSubtasks && (
                <button
                  onClick={() => toggleTaskExpansion(task.id)}
                  className="flex-shrink-0 mt-1"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-apple-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-apple-gray-500" />
                  )}
                </button>
              )}

              {/* Task Status */}
              <button
                onClick={() => onTaskComplete(task.id)}
                className="flex-shrink-0 mt-1"
              >
                <CheckCircle 
                  className={`h-5 w-5 ${getStatusColor(task.status)}`} 
                />
              </button>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${
                        task.status === 'COMPLETED' ? 'line-through text-apple-gray-500' : 'text-apple-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      {level > 0 && (
                        <span className="text-xs text-apple-gray-500 font-medium px-2 py-1 bg-apple-gray-100 rounded">
                          Level {level}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-apple-gray-600 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Task Metadata */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-apple-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                      
                      {task.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatTime(task.estimatedTime)}
                        </div>
                      )}

                      {task.responsibleParty && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {task.responsibleParty}
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
                    </div>

                    {/* AI Suggestions */}
                    {task.suggestedStartDate && (
                      <div className="mt-2 p-2 bg-apple-blue/5 rounded-lg">
                        <p className="text-xs text-apple-blue font-medium">AI Suggested Schedule</p>
                        <p className="text-xs text-apple-gray-600">
                          {formatDate(task.suggestedStartDate)} → {formatDate(task.suggestedEndDate)}
                        </p>
                      </div>
                    )}

                    {/* Blocking Status */}
                    {isBlocked && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <p className="text-xs text-red-700 font-medium">
                            {task.blockingReason || 'Blocked by dependencies'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    
                    {task.status === 'TODO' && !isBlocked && (
                      <Button
                        size="sm"
                        onClick={() => onTaskStart(task.id)}
                        className="h-8 px-3"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {task.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTaskPause(task.id)}
                        className="h-8 px-3"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openTaskAssistance(task)}
                      className="h-8 px-3"
                    >
                      <Brain className="h-4 w-4 mr-1" />
                      AI Help
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subtasks */}
        {hasSubtasks && isExpanded && (
          <div className="space-y-1">
            {task.subtasks!.map(subtask => renderTaskCard(subtask, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const renderTimelineView = () => {
    const sortedTasks = [...tasks].sort((a, b) => {
      const aDate = a.suggestedStartDate || a.dueDate || '9999-12-31'
      const bDate = b.suggestedStartDate || b.dueDate || '9999-12-31'
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })

    return (
      <div className="space-y-4">
        {sortedTasks.map(task => (
          <div key={task.id} className="flex items-center gap-4 p-4 bg-apple-gray-50 rounded-lg">
            <div className="flex-shrink-0 w-12 text-center">
              <p className="text-sm font-medium">{formatDate(task.suggestedStartDate || task.dueDate)}</p>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-apple-gray-600">{formatTime(task.estimatedTime)}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${getStatusColor(task.status)}`} />
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderKanbanView = () => {
    const columns = [
      { id: 'TODO', title: 'To Do', tasks: tasks.filter(t => t.status === 'TODO') },
      { id: 'IN_PROGRESS', title: 'In Progress', tasks: tasks.filter(t => t.status === 'IN_PROGRESS') },
      { id: 'COMPLETED', title: 'Completed', tasks: tasks.filter(t => t.status === 'COMPLETED') }
    ]

    return (
      <div className="grid grid-cols-3 gap-4">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            <h3 className="font-medium text-apple-gray-700">{column.title} ({column.tasks.length})</h3>
            <div className="space-y-2">
              {column.tasks.map(task => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-apple-gray-500">{formatTime(task.estimatedTime)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-apple-gray-100 rounded-lg p-1">
          {[
            { id: 'hierarchy', label: 'Hierarchy', icon: ChevronDown },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'kanban', label: 'Kanban', icon: Square }
          ].map((mode) => {
            const Icon = mode.icon
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-apple-blue shadow-sm'
                    : 'text-apple-gray-600 hover:text-apple-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {mode.label}
              </button>
            )
          })}
        </div>

        <div className="text-sm text-apple-gray-600">
          {(() => {
            const { total, completed } = (() => {
              const calculateNestedCompletion = (taskList: Task[]): { total: number; completed: number } => {
                let total = 0
                let completed = 0
                
                for (const task of taskList) {
                  total++
                  if (task.status === 'COMPLETED') {
                    completed++
                  }
                  
                  if (task.subtasks && task.subtasks.length > 0) {
                    const nested = calculateNestedCompletion(task.subtasks)
                    total += nested.total
                    completed += nested.completed
                  }
                }
                
                return { total, completed }
              }
              
              return calculateNestedCompletion(tasks)
            })()
            return `${completed} of ${total} tasks completed`
          })()}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'hierarchy' && (
        <div className="space-y-4">
          {tasks.map(task => renderTaskCard(task))}
        </div>
      )}

      {viewMode === 'timeline' && renderTimelineView()}

      {viewMode === 'kanban' && renderKanbanView()}

      {/* Task Assistance Dialog */}
      <Dialog open={assistanceDialogOpen} onOpenChange={setAssistanceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Task Assistance
            </DialogTitle>
            <DialogDescription>
              Get help with: {selectedTaskForAssistance?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task Info */}
            <div className="bg-apple-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Task Details</h4>
              <p className="text-sm text-apple-gray-600">{selectedTaskForAssistance?.description || 'No description'}</p>
            </div>

            {/* User Query */}
            <div>
              <label className="block text-sm font-medium mb-2">What do you need help with?</label>
              <Textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Describe what you're stuck on or need help with..."
                rows={3}
              />
            </div>

            {/* Get Assistance Button */}
            <Button
              onClick={getTaskAssistance}
              disabled={!userQuery.trim() || loadingAssistance}
              className="w-full"
            >
              {loadingAssistance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Getting AI Assistance...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Get AI Assistance
                </>
              )}
            </Button>

            {/* AI Response */}
            {assistance && (
              <div className="space-y-4">
                {assistance.suggestions && assistance.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {assistance.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-apple-blue rounded-full mt-2 flex-shrink-0"></div>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {assistance.nextSteps && assistance.nextSteps.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Next Steps</h4>
                    <ul className="space-y-2">
                      {assistance.nextSteps.map((step: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-apple-green rounded-full mt-2 flex-shrink-0"></div>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {assistance.resources && assistance.resources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Resources</h4>
                    <ul className="space-y-2">
                      {assistance.resources.map((resource: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {assistance.warnings && assistance.warnings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-orange-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </h4>
                    <ul className="space-y-2">
                      {assistance.warnings.map((warning: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
