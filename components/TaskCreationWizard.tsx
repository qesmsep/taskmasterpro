'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  Tag, 
  CheckCircle, 
  Brain, 
  ArrowRight, 
  ArrowLeft,
  AlertTriangle,
  Calendar as CalendarIcon,
  Settings,
  Wrench
} from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  color: string
  description?: string
  schedules: Array<{
    dayOfWeek: number
    startHour: number
    endHour: number
    isActive: boolean
  }>
}

interface TaskCreationStep {
  stepNumber: number
  stepType: 'basic_info' | 'success_criteria' | 'details' | 'ai_review'
  data: any
  isCompleted: boolean
}

interface TaskReviewResult {
  suggestedProjectName?: string
  suggestions: string[]
  clarifyingQuestions: string[]
  estimatedDuration: number
  complexity: 'low' | 'medium' | 'high'
  recommendedSubtasks: Array<{
    title: string
    description?: string
    estimatedTime: number
    suggestedDueDate?: string
    priority: 'low' | 'medium' | 'high'
    dependencies?: string[]
  }>
  potentialRisks: string[]
  calendarConflicts?: Array<{
    date: string
    conflictType: 'busy' | 'vacation' | 'meeting'
    description: string
  }>
  toolsAndSupplies?: {
    tools: string[]
    materials: string[]
    safety: string[]
  }
}

export default function TaskCreationWizard({ 
  isOpen, 
  onClose, 
  onTaskCreated 
}: { 
  isOpen: boolean
  onClose: () => void
  onTaskCreated: (task: any) => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [clarifyingAnswers, setClarifyingAnswers] = useState<{[key: string]: string}>({})
  const [contextQuestions, setContextQuestions] = useState<string[]>([])
  const [contextAnswers, setContextAnswers] = useState<{[key: string]: string}>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [contextAttachments, setContextAttachments] = useState<{[key: string]: File[]}>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [aiReview, setAiReview] = useState<TaskReviewResult | null>(null)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    categoryId: '',
    successCriteria: '',
    context: '',
    estimatedTime: 0,
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    isRecurring: false,
    recurrenceRule: ''
  })
  const [suggestedProjectName, setSuggestedProjectName] = useState('')

  // Interactive selections
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([])
  const [suggestionFeedback, setSuggestionFeedback] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchCalendarEvents()
    }
  }, [isOpen])

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

  const fetchCalendarEvents = async () => {
    // TODO: Implement calendar integration
    // For now, using mock data
    setCalendarEvents([
      {
        id: '1',
        title: 'Team Meeting',
        start: '2024-01-15T14:00:00Z',
        end: '2024-01-15T15:00:00Z',
        type: 'meeting'
      }
    ])
  }

  const handleNext = async () => {
    if (currentStep === 2) {
      // Generate context questions based on success criteria
      await generateContextQuestions()
    } else if (currentStep === 3) {
      // Generate initial AI review
      await generateAIReview()
    } else if (currentStep === 4) {
      // Generate final AI review with clarifying answers
      await generateFinalAIReview()
    }
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const generateContextQuestions = async () => {
    setLoading(true)
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ai/context-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          taskData: {
            title: formData.title,
            dueDate: formData.dueDate,
            category: categories.find(c => c.id === formData.categoryId)?.name,
            successCriteria: formData.successCriteria
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setContextQuestions(data.questions || [])
      }
    } catch (error) {
      console.error('Error generating context questions:', error)
      // Fallback questions if AI fails
      setContextQuestions([
        'Here\'s what I think the main goal should be - does this match what you\'re trying to achieve?',
        'Based on this type of project, I suggest these steps. Would you like to adjust any of these?',
        'I recommend these tools/resources. Do you have access to these or need alternatives?',
        'Who should be involved? I suggest these people. Are there others I\'m missing?',
        'Potential challenges I see. How can we address these?',
        'Success metrics I suggest. Do these align with your expectations?'
      ])
    } finally {
      setLoading(false)
    }
  }

  const generateAIReview = async () => {
    setLoading(true)
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ai/task-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          taskData: {
            title: formData.title,
            dueDate: formData.dueDate,
            category: categories.find(c => c.id === formData.categoryId)?.name,
            successCriteria: formData.successCriteria,
            context: Object.keys(contextAnswers).length > 0 ? 
              `Context gathered from questions:\n${Object.entries(contextAnswers).map(([question, answer]) => `Q: ${question}\nA: ${answer}`).join('\n\n')}` : 
              formData.context
          },
          calendarEvents
        })
      })

      if (response.ok) {
        const review = await response.json()
        setAiReview(review)
        if (review.suggestedProjectName) {
          setSuggestedProjectName(review.suggestedProjectName)
          setFormData(prev => ({ ...prev, title: review.suggestedProjectName }))
        }
      }
    } catch (error) {
      console.error('Error generating AI review:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateFinalAIReview = async () => {
    setLoading(true)
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/ai/task-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          taskData: {
            title: formData.title,
            dueDate: formData.dueDate,
            category: categories.find(c => c.id === formData.categoryId)?.name,
            successCriteria: formData.successCriteria,
            context: formData.context,
            clarifyingAnswers
          },
          calendarEvents
        })
      })

      if (response.ok) {
        const review = await response.json()
        setAiReview(review)
        if (review.suggestedProjectName) {
          setSuggestedProjectName(review.suggestedProjectName)
          setFormData(prev => ({ ...prev, title: review.suggestedProjectName }))
        }
      }
    } catch (error) {
      console.error('Error generating final AI review:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    setLoading(true)
    try {
      if (!supabase) {
        console.error('Supabase not configured')
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.context,
          dueDate: formData.dueDate,
          categoryId: formData.categoryId,
          priority: formData.priority,
          estimatedTime: aiReview?.estimatedDuration || formData.estimatedTime,
          successCriteria: formData.successCriteria,
          aiSuggestions: aiReview,
          isRecurring: formData.isRecurring,
          recurrenceRule: formData.recurrenceRule,
          selectedSuggestions: selectedSuggestions.map(suggestion => ({
            suggestion,
            feedback: suggestionFeedback[suggestion] || ''
          })),
          subtasks: aiReview?.recommendedSubtasks
            .filter((_, index) => selectedSubtasks.includes(index))
            .map(subtask => ({
              ...subtask,
              status: 'TODO'
            })) || []
        })
      })

      if (response.ok) {
        const task = await response.json()
        onTaskCreated(task)
        onClose()
        // Reset form
        setFormData({
          title: '',
          dueDate: '',
          categoryId: '',
          successCriteria: '',
          context: '',
          estimatedTime: 0,
          priority: 'MEDIUM',
          isRecurring: false,
          recurrenceRule: ''
        })
        setCurrentStep(1)
        setAiReview(null)
        setSelectedSuggestions([])
        setSelectedSubtasks([])
        setSuggestionFeedback({})
        setClarifyingAnswers({})
        setContextQuestions([])
        setContextAnswers({})
        setCurrentQuestionIndex(0)
        setContextAttachments({})
        setSuggestedProjectName('')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.dueDate && formData.categoryId
      case 2:
        return formData.successCriteria.trim()
      case 3:
        return contextQuestions.length > 0 && Object.keys(contextAnswers).length > 0
      case 4:
        return aiReview !== null
      case 5:
        return aiReview !== null
      default:
        return false
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-apple-gray-700 mb-2">
          Task Name *
        </label>
        <Input
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-apple-gray-700 mb-2">
          Due Date *
        </label>
        <Input
          type="datetime-local"
          value={formData.dueDate}
          onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
        />
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
            />
            <span className="text-sm text-apple-gray-700">Recurring task</span>
          </label>
        </div>
        {formData.isRecurring && (
          <div className="mt-3">
            <select
              value={formData.recurrenceRule}
              onChange={(e) => setFormData(prev => ({ ...prev, recurrenceRule: e.target.value }))}
              className="w-full px-3 py-2 border border-apple-gray-300 rounded-md text-sm"
            >
              <option value="">Select recurrence pattern</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-apple-gray-700 mb-2">
          Category *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setFormData(prev => ({ ...prev, categoryId: category.id }))}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                formData.categoryId === category.id
                  ? 'border-apple-blue bg-apple-blue/5'
                  : 'border-apple-gray-200 hover:border-apple-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium">{category.name}</span>
              </div>
              {category.description && (
                <p className="text-sm text-apple-gray-600 mt-1">{category.description}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-apple-gray-700 mb-2">
          What does "done" look like? *
        </label>
        <Textarea
          placeholder="Describe the specific outcomes that will indicate this task is complete..."
          value={formData.successCriteria}
          onChange={(e) => setFormData(prev => ({ ...prev, successCriteria: e.target.value }))}
          rows={4}
        />
        <p className="text-sm text-apple-gray-600 mt-2">
          Be specific about measurable outcomes, deliverables, or criteria for success.
        </p>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <Brain className="h-12 w-12 text-apple-blue mx-auto animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-900 mb-2">AI is analyzing...</h3>
          <p className="text-apple-gray-600">Generating personalized questions to understand your context better</p>
        </div>
      ) : contextQuestions.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Brain className="h-8 w-8 text-apple-blue mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-apple-gray-900">Let's gather more context</h3>
            <p className="text-apple-gray-600">Answer these questions to help create a better project plan</p>
          </div>
          
          {/* Progress indicator */}
          <div className="text-center mb-4">
            <div className="text-sm text-apple-gray-600">
              Question {currentQuestionIndex + 1} of {contextQuestions.length}
            </div>
            <div className="w-full bg-apple-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-apple-blue h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / contextQuestions.length) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Current question */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-apple-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {currentQuestionIndex + 1}
                  </div>
                  <h3 className="text-lg font-medium text-apple-gray-900">
                    {contextQuestions[currentQuestionIndex]}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Your answer..."
                    value={contextAnswers[contextQuestions[currentQuestionIndex]] || ''}
                    onChange={(e) => setContextAnswers(prev => ({
                      ...prev,
                      [contextQuestions[currentQuestionIndex]]: e.target.value
                    }))}
                    rows={4}
                    className="text-base"
                  />
                  
                  {/* File upload section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-apple-gray-700">
                      Add files (optional)
                    </label>
                    <div className="border-2 border-dashed border-apple-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.csv,.xlsx,.doc,.docx,.txt"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          setContextAttachments(prev => ({
                            ...prev,
                            [contextQuestions[currentQuestionIndex]]: [
                              ...(prev[contextQuestions[currentQuestionIndex]] || []),
                              ...files
                            ]
                          }))
                        }}
                        className="hidden"
                        id={`file-upload-${currentQuestionIndex}`}
                      />
                      <label 
                        htmlFor={`file-upload-${currentQuestionIndex}`}
                        className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-8 h-8 bg-apple-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-apple-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <div className="text-sm text-apple-gray-600">
                          <span className="font-medium text-apple-blue hover:text-apple-blue/80">Click to upload</span> or drag and drop
                        </div>
                        <div className="text-xs text-apple-gray-500">
                          Images, PDFs, CSVs, Excel files, Word docs, text files
                        </div>
                      </label>
                    </div>
                    
                    {/* Show uploaded files */}
                    {contextAttachments[contextQuestions[currentQuestionIndex]]?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-apple-gray-700">Uploaded files:</div>
                        <div className="space-y-1">
                          {contextAttachments[contextQuestions[currentQuestionIndex]].map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-apple-gray-50 rounded-lg p-2">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-apple-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="text-sm text-apple-gray-700">{file.name}</span>
                                <span className="text-xs text-apple-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setContextAttachments(prev => ({
                                    ...prev,
                                    [contextQuestions[currentQuestionIndex]]: 
                                      prev[contextQuestions[currentQuestionIndex]].filter((_, i) => i !== index)
                                  }))
                                }}
                                className="text-apple-red hover:text-apple-red/80"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
                  {/* Main navigation and question navigation */}
        <div className="flex justify-between items-center mb-6">
          {/* Main navigation buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Question navigation */}
          <div className="flex items-center gap-4">
            {/* Question navigation dots */}
            <div className="flex gap-2">
              {contextQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-apple-blue'
                      : index < Object.keys(contextAnswers).length
                        ? 'bg-apple-green'
                        : 'bg-apple-gray-300'
                  }`}
                  title={`Question ${index + 1}`}
                />
              ))}
            </div>

            {/* Question navigation buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(prev - 1, 0))}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentQuestionIndex(prev => Math.min(prev + 1, contextQuestions.length - 1))}
                disabled={currentQuestionIndex === contextQuestions.length - 1}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-apple-gray-600">Loading context questions...</p>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <Brain className="h-12 w-12 text-apple-blue mx-auto animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-900 mb-2">AI is thinking...</h3>
          <p className="text-apple-gray-600 mb-4">Analyzing your task details and generating personalized recommendations</p>
          <div className="max-w-md mx-auto">
            <div className="bg-apple-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-apple-gray-600 mb-2">
                <CheckCircle className="h-4 w-4 text-apple-green" />
                <span>Reviewing task complexity and requirements</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-apple-gray-600 mb-2">
                <CheckCircle className="h-4 w-4 text-apple-green" />
                <span>Generating subtasks and timeline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-apple-gray-600">
                <div className="h-4 w-4 rounded-full border-2 border-apple-blue border-t-transparent animate-spin"></div>
                <span>Checking calendar conflicts</span>
              </div>
            </div>
          </div>
        </div>
      ) : aiReview ? (
        <div className="space-y-6">
          {/* Project Name Suggestion */}
                                  {aiReview.suggestedProjectName && (
                          <Card className="border-apple-blue/20">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-apple-blue">
                                <Brain className="h-5 w-5" />
                                Suggested Project Name
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <p className="text-sm text-apple-gray-600">
                                  Based on your project details, I suggest this name:
                                </p>
                                <div className="bg-apple-blue/5 rounded-lg p-3">
                                  <p className="font-medium text-apple-blue">{aiReview.suggestedProjectName}</p>
                                </div>
                                <p className="text-xs text-apple-gray-500">
                                  You can edit this name in the project details if needed.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Tools and Supplies */}
                        {aiReview.toolsAndSupplies && (
                          <Card className="border-apple-green/20">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-apple-green">
                                <Wrench className="h-5 w-5" />
                                Tools & Supplies Needed
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {aiReview.toolsAndSupplies.tools && aiReview.toolsAndSupplies.tools.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-apple-gray-900 mb-2">Tools</h4>
                                    <ul className="space-y-1">
                                      {aiReview.toolsAndSupplies.tools.map((tool: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                          <div className="w-2 h-2 bg-apple-green rounded-full"></div>
                                          {tool}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {aiReview.toolsAndSupplies.materials && aiReview.toolsAndSupplies.materials.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-apple-gray-900 mb-2">Materials</h4>
                                    <ul className="space-y-1">
                                      {aiReview.toolsAndSupplies.materials.map((material: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                          <div className="w-2 h-2 bg-apple-blue rounded-full"></div>
                                          {material}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {aiReview.toolsAndSupplies.safety && aiReview.toolsAndSupplies.safety.length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-apple-gray-900 mb-2">Safety Equipment</h4>
                                    <ul className="space-y-1">
                                      {aiReview.toolsAndSupplies.safety.map((item: string, index: number) => (
                                        <li key={index} className="flex items-center gap-2 text-sm">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

          {/* Clarifying Questions */}
          {aiReview.clarifyingQuestions && aiReview.clarifyingQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-apple-blue" />
                  Clarifying Questions
                </CardTitle>
                <CardDescription>
                  Please answer these questions to help create a more detailed project plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiReview.clarifyingQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <label className="block text-sm font-medium text-apple-gray-700">
                        {question}
                      </label>
                      <Textarea
                        placeholder="Your answer..."
                        value={clarifyingAnswers[question] || ''}
                        onChange={(e) => setClarifyingAnswers(prev => ({
                          ...prev,
                          [question]: e.target.value
                        }))}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Suggestions */}
          {aiReview.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-apple-blue" />
                  AI Suggestions
                </CardTitle>
                <CardDescription>
                  Select suggestions you'd like to implement and provide additional context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiReview.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-apple-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.includes(suggestion)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuggestions(prev => [...prev, suggestion])
                            } else {
                              setSelectedSuggestions(prev => prev.filter(s => s !== suggestion))
                            }
                          }}
                          className="mt-1 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-apple-gray-900">{suggestion}</p>
                          {selectedSuggestions.includes(suggestion) && (
                            <div className="mt-2">
                              <Textarea
                                placeholder="Provide more context or specific details about this suggestion..."
                                value={suggestionFeedback[suggestion] || ''}
                                onChange={(e) => setSuggestionFeedback(prev => ({
                                  ...prev,
                                  [suggestion]: e.target.value
                                }))}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Task Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-blue">
                    {Math.floor(aiReview.estimatedDuration / 60)}h {aiReview.estimatedDuration % 60}m
                  </div>
                  <div className="text-sm text-apple-gray-600">Estimated Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    aiReview.complexity === 'high' ? 'text-apple-red' :
                    aiReview.complexity === 'medium' ? 'text-apple-orange' : 'text-apple-green'
                  }`}>
                    {aiReview.complexity.toUpperCase()}
                  </div>
                  <div className="text-sm text-apple-gray-600">Complexity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-purple">
                    {aiReview.recommendedSubtasks.length}
                  </div>
                  <div className="text-sm text-apple-gray-600">Subtasks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="relative mb-6">
            <Brain className="h-12 w-12 text-apple-blue mx-auto animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-apple-blue rounded-full animate-bounce ml-1" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-apple-gray-900 mb-2">AI is thinking...</h3>
          <p className="text-apple-gray-600 mb-4">Analyzing your task details and generating personalized recommendations</p>
          <div className="max-w-md mx-auto">
            <div className="bg-apple-gray-100 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-apple-gray-600 mb-2">
                <CheckCircle className="h-4 w-4 text-apple-green" />
                <span>Reviewing task complexity and requirements</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-apple-gray-600 mb-2">
                <CheckCircle className="h-4 w-4 text-apple-green" />
                <span>Generating subtasks and timeline</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-apple-gray-600">
                <div className="h-4 w-4 rounded-full border-2 border-apple-blue border-t-transparent animate-spin"></div>
                <span>Checking calendar conflicts</span>
              </div>
            </div>
          </div>
        </div>
      ) : aiReview ? (
        <div className="space-y-6">
          {/* AI Suggestions */}
          {aiReview.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-apple-blue" />
                  AI Suggestions
                </CardTitle>
                <CardDescription>
                  Select suggestions you'd like to implement and provide additional context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiReview.suggestions.map((suggestion, index) => (
                    <div key={index} className="border border-apple-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.includes(suggestion)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuggestions(prev => [...prev, suggestion])
                            } else {
                              setSelectedSuggestions(prev => prev.filter(s => s !== suggestion))
                            }
                          }}
                          className="mt-1 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-apple-gray-900">{suggestion}</p>
                          {selectedSuggestions.includes(suggestion) && (
                            <div className="mt-2">
                              <Textarea
                                placeholder="Provide more context or specific details about this suggestion..."
                                value={suggestionFeedback[suggestion] || ''}
                                onChange={(e) => setSuggestionFeedback(prev => ({
                                  ...prev,
                                  [suggestion]: e.target.value
                                }))}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Task Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-blue">
                    {Math.floor(aiReview.estimatedDuration / 60)}h {aiReview.estimatedDuration % 60}m
                  </div>
                  <div className="text-sm text-apple-gray-600">Estimated Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    aiReview.complexity === 'high' ? 'text-apple-red' :
                    aiReview.complexity === 'medium' ? 'text-apple-orange' : 'text-apple-green'
                  }`}>
                    {aiReview.complexity.toUpperCase()}
                  </div>
                  <div className="text-sm text-apple-gray-600">Complexity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-apple-purple">
                    {aiReview.recommendedSubtasks.length}
                  </div>
                  <div className="text-sm text-apple-gray-600">Subtasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Subtasks */}
          {aiReview.recommendedSubtasks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recommended Subtasks</CardTitle>
                    <CardDescription>
                      Select subtasks you'd like to add to your task
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedSubtasks.length === aiReview.recommendedSubtasks.length) {
                        setSelectedSubtasks([])
                      } else {
                        setSelectedSubtasks(aiReview.recommendedSubtasks.map((_, index) => index))
                      }
                    }}
                  >
                    {selectedSubtasks.length === aiReview.recommendedSubtasks.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiReview.recommendedSubtasks.map((subtask, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-apple-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedSubtasks.includes(index)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubtasks(prev => [...prev, index])
                          } else {
                            setSelectedSubtasks(prev => prev.filter(i => i !== index))
                          }
                        }}
                        className="mt-1 rounded border-apple-gray-300 text-apple-blue focus:ring-apple-blue"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{subtask.title}</div>
                        {subtask.description && (
                          <div className="text-sm text-apple-gray-600">{subtask.description}</div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-apple-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {subtask.estimatedTime}m
                          </span>
                          {subtask.suggestedDueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(subtask.suggestedDueDate), 'MMM d')}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full ${
                            subtask.priority === 'high' ? 'bg-apple-red/10 text-apple-red' :
                            subtask.priority === 'medium' ? 'bg-apple-orange/10 text-apple-orange' :
                            'bg-apple-green/10 text-apple-green'
                          }`}>
                            {subtask.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar Conflicts */}
          {aiReview.calendarConflicts && aiReview.calendarConflicts.length > 0 && (
            <Card className="border-apple-orange/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-apple-orange">
                  <AlertTriangle className="h-5 w-5" />
                  Calendar Conflicts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aiReview.calendarConflicts.map((conflict, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-apple-orange" />
                      <span>{conflict.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {aiReview && (
            <Card className="border-apple-blue/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-apple-blue">
                  <CheckCircle className="h-5 w-5" />
                  Task Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-apple-gray-600">Selected suggestions:</span>
                    <span className="font-medium">{selectedSuggestions.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-apple-gray-600">Selected subtasks:</span>
                    <span className="font-medium">{selectedSubtasks.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-apple-gray-600">Estimated time:</span>
                    <span className="font-medium">
                      {Math.floor(aiReview.estimatedDuration / 60)}h {aiReview.estimatedDuration % 60}m
                    </span>
                  </div>
                  {formData.isRecurring && (
                    <div className="flex justify-between text-sm">
                      <span className="text-apple-gray-600">Recurrence:</span>
                      <span className="font-medium capitalize">{formData.recurrenceRule}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      default:
        return null
    }
  }

  const stepTitles = [
    'Basic Information',
    'Success Criteria',
    'AI-Guided Context',
    'AI Questions & Suggestions',
    'Final Review & Planning'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Step {currentStep} of 5: {stepTitles[currentStep - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-apple-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-apple-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        {renderCurrentStep()}

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
            >
              {currentStep === 2 && loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Generating Questions...
                </>
              ) : currentStep === 3 && loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  AI Thinking...
                </>
              ) : currentStep === 4 && loading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2"></div>
                  Finalizing Plan...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={createTask}
              disabled={!canProceed() || loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
