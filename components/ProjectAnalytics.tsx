'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Lightbulb,
  Zap
} from 'lucide-react'

interface ProjectAnalyticsProps {
  projectId: string
  projectData: any
}

export default function ProjectAnalytics({ projectId, projectData }: ProjectAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'insights' | 'optimization'>('overview')

  useEffect(() => {
    if (projectId) {
      generateAnalytics()
    }
  }, [projectId])

  const generateAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/project/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error generating analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue"></div>
              <span className="ml-2">Generating project insights...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-apple-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'insights', label: 'Insights', icon: Lightbulb },
          { id: 'optimization', label: 'Optimization', icon: Zap }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-apple-green">
                    {analytics.completionRate}%
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
                  <p className="text-sm text-apple-gray-600">Time Efficiency</p>
                  <p className="text-2xl font-bold text-apple-blue">
                    {analytics.timeEfficiency}%
                  </p>
                </div>
                <Clock className="h-8 w-8 text-apple-blue" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Risk Level</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {analytics.riskLevel}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-apple-gray-600">Days Remaining</p>
                  <p className="text-2xl font-bold text-apple-gray-900">
                    {analytics.daysRemaining}
                  </p>
                </div>
                <Target className="h-8 w-8 text-apple-gray-900" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Optimized Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.optimizedSchedule?.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-apple-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-apple-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.taskTitle}</p>
                    <p className="text-sm text-apple-gray-600">{item.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.suggestedStartDate}</p>
                    <p className="text-xs text-apple-gray-500">{item.estimatedTime}min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.productivityPatterns?.map((pattern: any, index: number) => (
                  <div key={index} className="p-4 border border-apple-blue/20 rounded-lg">
                    <h4 className="font-medium text-apple-blue mb-2">{pattern.pattern}</h4>
                    <p className="text-sm text-apple-gray-600 mb-2">{pattern.insight}</p>
                    <p className="text-sm font-medium text-apple-green">{pattern.recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.riskAssessment?.map((risk: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700">{risk.risk}</p>
                      <p className="text-sm text-red-600 mt-1">{risk.mitigation}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          risk.probability === 'high' ? 'bg-red-100 text-red-700' :
                          risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {risk.probability} probability
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          risk.impact === 'high' ? 'bg-red-100 text-red-700' :
                          risk.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {risk.impact} impact
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Time Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-apple-green/10 rounded-lg">
                  <div>
                    <p className="font-medium text-apple-green">Time Saved</p>
                    <p className="text-2xl font-bold text-apple-green">
                      {analytics.timeOptimization?.timeSaved || 0} minutes
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-apple-green" />
                </div>

                <div>
                  <h4 className="font-medium mb-3">Optimization Recommendations</h4>
                  <div className="space-y-2">
                    {analytics.timeOptimization?.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-apple-blue/5 rounded-lg">
                        <div className="w-2 h-2 bg-apple-blue rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efficiency Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analytics.efficiencySuggestions?.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-apple-gray-50 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-apple-blue mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
