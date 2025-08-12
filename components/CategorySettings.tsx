'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  Settings,
  Tag
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface CategoryFormData {
  name: string
  color: string
  description: string
  schedules: Array<{
    dayOfWeek: number
    startHour: number
    endHour: number
    isActive: boolean
  }>
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DEFAULT_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', 
  '#FF2D92', '#FFCC02', '#5856D6', '#FF6B35', '#4ECDC4'
]

export default function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: '#007AFF',
    description: '',
    schedules: []
  })

  useEffect(() => {
    fetchCategories()
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

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchCategories()
        setShowCreateDialog(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchCategories()
        setEditingCategory(null)
        resetForm()
      }
    } catch (error) {
      console.error('Error updating category:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        await fetchCategories()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#007AFF',
      description: '',
      schedules: []
    })
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      color: category.color,
      description: category.description || '',
      schedules: category.schedules.map(s => ({ ...s }))
    })
  }

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        dayOfWeek: 1, // Monday
        startHour: 9,
        endHour: 17,
        isActive: true
      }]
    }))
  }

  const updateSchedule = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) => 
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }))
  }

  const removeSchedule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }))
  }

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:00 ${period}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-apple-gray-900">Category Settings</h1>
          <p className="text-apple-gray-600 mt-1">
            Manage your task categories and their scheduling preferences
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!category.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-apple-red hover:text-apple-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-apple-gray-600">Tasks</span>
                  <span className="font-medium">{category._count.tasks}</span>
                </div>
                
                {category.schedules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-apple-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Schedules</span>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!editingCategory} onOpenChange={() => {
        setShowCreateDialog(false)
        setEditingCategory(null)
        resetForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              Configure your category and set when tasks in this category can be worked on.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Category Name *
                </label>
                <Input
                  placeholder="e.g., Work, Personal, Financial"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {DEFAULT_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color ? 'border-apple-gray-900' : 'border-apple-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-apple-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  placeholder="Optional description of this category..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Scheduling */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-apple-gray-700">
                  Working Schedule
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSchedule}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>

              {formData.schedules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-apple-gray-200 rounded-lg">
                  <Calendar className="h-8 w-8 text-apple-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-apple-gray-600">No schedules set</p>
                  <p className="text-xs text-apple-gray-500">Tasks in this category can be worked on anytime</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-apple-gray-50 rounded-lg">
                      <select
                        value={schedule.dayOfWeek}
                        onChange={(e) => updateSchedule(index, 'dayOfWeek', parseInt(e.target.value))}
                        className="flex-1 px-3 py-2 border border-apple-gray-300 rounded-md text-sm"
                      >
                        {DAYS_OF_WEEK.map((day, dayIndex) => (
                          <option key={dayIndex} value={dayIndex}>{day}</option>
                        ))}
                      </select>
                      
                      <select
                        value={schedule.startHour}
                        onChange={(e) => updateSchedule(index, 'startHour', parseInt(e.target.value))}
                        className="px-3 py-2 border border-apple-gray-300 rounded-md text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{formatTime(i)}</option>
                        ))}
                      </select>
                      
                      <span className="text-apple-gray-500">to</span>
                      
                      <select
                        value={schedule.endHour}
                        onChange={(e) => updateSchedule(index, 'endHour', parseInt(e.target.value))}
                        className="px-3 py-2 border border-apple-gray-300 rounded-md text-sm"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{formatTime(i)}</option>
                        ))}
                      </select>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSchedule(index)}
                        className="text-apple-red hover:text-apple-red"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setEditingCategory(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
              disabled={!formData.name.trim() || loading}
            >
              {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
