'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  Clock,
  Users,
  Tag,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  Plus,
  Grid,
  List
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    id: string
    name: string
    color: string
  }
  responsibleParty?: string
  successCriteria?: string
  subtasks: Array<{
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  }>
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  color: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt' | 'priority' | 'title'>('dueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchProjects()
    fetchCategories()
  }, [])

  const fetchProjects = async () => {
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks?type=projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
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

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || project.category?.id === selectedCategory
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return '0m'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getCompletionRate = (project: Project) => {
    const totalTasks = project.subtasks.length
    const completedTasks = project.subtasks.filter(t => t.status === 'COMPLETED').length
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  }

  const getDaysRemaining = (dueDate?: string) => {
    if (!dueDate) return null
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
        <span className="ml-2">Loading projects...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-apple-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-apple-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-apple-gray-900">Projects</h1>
              <p className="text-apple-gray-600 mt-1">
                Manage and track all your projects
              </p>
            </div>
            <Link href="/dashboard">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-apple-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-apple-gray-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-apple-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-apple-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-3 py-2 border border-apple-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-transparent"
              >
                <option value="dueDate-asc">Due Date (Earliest)</option>
                <option value="dueDate-desc">Due Date (Latest)</option>
                <option value="createdAt-desc">Created (Newest)</option>
                <option value="createdAt-asc">Created (Oldest)</option>
                <option value="priority-desc">Priority (High to Low)</option>
                <option value="priority-asc">Priority (Low to High)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-apple-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-apple-blue text-white' : 'bg-white text-apple-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-apple-blue text-white' : 'bg-white text-apple-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-apple-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-apple-gray-900 mb-2">No projects found</h3>
            <p className="text-apple-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first project.'
              }
            </p>
            <Link href="/dashboard">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredAndSortedProjects.map(project => {
              const completionRate = getCompletionRate(project)
              const daysRemaining = getDaysRemaining(project.dueDate)
              const isOverdue = daysRemaining !== null && daysRemaining < 0

              return (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                    isOverdue ? 'border-red-200 bg-red-50' : ''
                  }`}>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-apple-gray-900 truncate">
                            {project.title}
                          </h3>
                          {project.description && (
                            <p className="text-sm text-apple-gray-600 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                          <CheckCircle className={`h-5 w-5 ${getStatusColor(project.status)}`} />
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-apple-gray-600">Progress</span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-apple-gray-200 rounded-full h-2">
                          <div 
                            className="bg-apple-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-2 text-sm text-apple-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(project.dueDate)}
                            {isOverdue && ` (${Math.abs(daysRemaining!)} days overdue)`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(project.estimatedTime)}</span>
                        </div>

                        {project.category && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ backgroundColor: `${project.category.color}20`, color: project.category.color }}
                            >
                              {project.category.name}
                            </span>
                          </div>
                        )}

                        {project.responsibleParty && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{project.responsibleParty}</span>
                          </div>
                        )}
                      </div>

                      {/* Task Summary */}
                      <div className="mt-4 pt-4 border-t border-apple-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-apple-gray-600">
                            {project.subtasks.filter(t => t.status === 'COMPLETED').length} of {project.subtasks.length} tasks
                          </span>
                          {isOverdue && (
                            <span className="text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-apple-gray-900">{projects.length}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-apple-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-apple-blue">
                    {projects.filter(p => p.status === 'IN_PROGRESS').length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-apple-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-apple-green">
                    {projects.filter(p => p.status === 'COMPLETED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-apple-green" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-500">
                    {projects.filter(p => getDaysRemaining(p.dueDate) !== null && getDaysRemaining(p.dueDate)! < 0).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
