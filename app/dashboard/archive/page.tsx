'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Archive, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Download,
  Trash2,
  RotateCcw,
  Tag,
  User
} from 'lucide-react'
import { formatDate, getPriorityColor } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  completedAt?: string
  estimatedTime?: number
  actualTime?: number
  category?: {
    name: string
    color: string
  }
  responsibleParty?: string
  tags: string[]
}

export default function ArchivePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchArchivedTasks()
  }, [])

  const fetchArchivedTasks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks?status=COMPLETED', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching archived tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (task.category?.name && task.category.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Status filter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter

    // Category filter
    const matchesCategory = categoryFilter === 'all' || task.category?.name === categoryFilter

    // Date range filter
    let matchesDate = true
    if (dateRange !== 'all' && task.completedAt) {
      const completedDate = new Date(task.completedAt)
      const now = new Date()
      
      switch (dateRange) {
        case 'today':
          matchesDate = completedDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = completedDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = completedDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate
  })

  const getUniqueCategories = () => {
    const categories = tasks.map(task => task.category?.name).filter(Boolean)
    return [...new Set(categories)]
  }

  const restoreTask = async (taskId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: 'TODO' })
      })

      if (response.ok) {
        await fetchArchivedTasks()
      }
    } catch (error) {
      console.error('Error restoring task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to permanently delete this task?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        await fetchArchivedTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const exportArchive = () => {
    const csvContent = [
      ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Completed Date', 'Category', 'Tags', 'Estimated Time', 'Actual Time'],
      ...filteredTasks.map(task => [
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.dueDate ? formatDate(task.dueDate) : '',
        task.completedAt ? formatDate(task.completedAt) : '',
        task.category?.name || '',
        task.tags.join(', '),
        task.estimatedTime || '',
        task.actualTime || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-archive-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-apple-gray-900">Archive</h1>
          <p className="text-apple-gray-600 mt-1">
            View and manage your completed tasks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportArchive}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-apple-gray-300 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-apple-gray-300 rounded-md"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-apple-gray-300 rounded-md"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-apple-gray-600">
          Showing {filteredTasks.length} of {tasks.length} archived tasks
        </div>
        <div className="text-sm text-apple-gray-500">
          {tasks.filter(t => t.status === 'COMPLETED').length} completed tasks
        </div>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Card className="border-dashed border-2 border-apple-gray-200">
          <CardContent className="p-8 text-center">
            <Archive className="h-12 w-12 text-apple-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-apple-gray-900 mb-2">No archived tasks found</h3>
            <p className="text-apple-gray-600">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Complete some tasks to see them here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-apple-gray-900 line-through">
                        {task.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-apple-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-apple-gray-500">
                      {task.completedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Completed {formatDate(task.completedAt)}
                        </div>
                      )}
                      
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

                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-apple-gray-100 text-apple-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => restoreTask(task.id)}
                      title="Restore task"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      title="Delete permanently"
                      className="text-apple-red hover:text-apple-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
