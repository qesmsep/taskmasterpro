import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TaskExpansionResult {
  subtasks: Array<{
    title: string
    description?: string
    estimatedTime?: number
  }>
  dependencies: string[]
  suggestions: string[]
}

export interface DailyAssessmentResult {
  todayPlan: string[]
  quickWins: string[]
  risks: string[]
  suggestions: string[]
}

export async function expandTask(
  taskTitle: string,
  taskDescription?: string,
  existingSubtasks?: string[]
): Promise<TaskExpansionResult> {
  const prompt = `
You are an AI assistant helping to break down a task into actionable subtasks. 

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}
${existingSubtasks ? `Existing subtasks: ${existingSubtasks.join(', ')}` : ''}

Please provide:
1. A list of 3-8 specific, actionable subtasks
2. Any dependencies this task might have on other tasks
3. Suggestions for improving efficiency

Format your response as JSON:
{
  "subtasks": [
    {
      "title": "Specific action item",
      "description": "Brief description if needed",
      "estimatedTime": 30
    }
  ],
  "dependencies": ["dependency1", "dependency2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Keep subtasks specific and actionable. Estimated time should be in minutes.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error expanding task:', error)
    return {
      subtasks: [],
      dependencies: [],
      suggestions: []
    }
  }
}

export async function generateDailyAssessment(
  completedTasks: string[],
  pendingTasks: string[],
  overdueTasks: string[]
): Promise<DailyAssessmentResult> {
  const prompt = `
You are an AI assistant providing a daily task assessment and planning guidance.

Yesterday's completed tasks: ${completedTasks.join(', ')}
Current pending tasks: ${pendingTasks.join(', ')}
Overdue tasks: ${overdueTasks.join(', ')}

Please provide:
1. A prioritized plan for today (3-5 most important tasks)
2. Quick wins that can be completed in under 30 minutes
3. Potential risks or blockers
4. General suggestions for productivity

Format your response as JSON:
{
  "todayPlan": ["task1", "task2", "task3"],
  "quickWins": ["quick task1", "quick task2"],
  "risks": ["risk1", "risk2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Focus on actionable, specific advice.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating daily assessment:', error)
    return {
      todayPlan: [],
      quickWins: [],
      risks: [],
      suggestions: []
    }
  }
}

export async function analyzeDependencies(
  taskId: string,
  taskTitle: string,
  dependentTasks: string[]
): Promise<string[]> {
  const prompt = `
You are analyzing task dependencies to identify potential risks.

Task: ${taskTitle}
Dependent tasks that will be blocked: ${dependentTasks.join(', ')}

Please identify potential risks and suggest mitigation strategies.

Format your response as a JSON array of risk descriptions:
["risk1", "risk2", "risk3"]

Focus on practical, actionable risks.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error analyzing dependencies:', error)
    return []
  }
}

export interface TaskReviewResult {
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

export interface TaskCreationData {
  title: string
  dueDate?: string
  category?: string
  successCriteria?: string
  context?: string
  clarifyingAnswers?: {[key: string]: string}
  userPreferences?: {
    workingHours?: { start: number; end: number }
    preferredDays?: number[]
    maxTaskDuration?: number
  }
}

export async function generateContextQuestions(taskData: {
  title: string
  dueDate?: string
  category?: string
  successCriteria?: string
}): Promise<string[]> {
  const prompt = `
You are an AI assistant helping to gather context for project planning. Based on the project information provided, generate 4-6 proactive questions that will help understand the full scope and context of the project.

Project Information:
- Title: ${taskData.title}
- Due Date: ${taskData.dueDate || 'Not specified'}
- Category: ${taskData.category || 'Not specified'}
- Success Criteria: ${taskData.successCriteria || 'Not specified'}

IMPORTANT: Start with questions about the user's skills, experience level, and capabilities, then move to project definition.

Generate proactive questions that suggest solutions rather than just asking for information:
1. "What's your experience level with [project type]? I'm thinking [beginner/intermediate/expert] based on the project scope."
2. "Here's what I think the main goal should be - [suggested goal]. Does this match what you're trying to achieve?"
3. "Based on this type of project, I suggest these steps: [list 3-4 key steps]. Would you like to adjust any of these?"
4. "I recommend these tools/resources: [suggest specific tools]. Do you have access to these or need alternatives?"
5. "Who should be involved? I suggest: [list stakeholders]. Are there others I'm missing?"
6. "Potential challenges I see: [list 2-3 challenges]. How can we address these?"

Write questions in simple language that a high school student could understand. Be proactive and helpful.

Format your response as a JSON array of question strings:
["Question 1", "Question 2", "Question 3", "Question 4"]

Make questions specific to the project type and context provided.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating context questions:', error)
    // Fallback questions
    return [
      'Here\'s what I think the main goal should be - does this match what you\'re trying to achieve?',
      'Based on this type of project, I suggest these steps. Would you like to adjust any of these?',
      'I recommend these tools/resources. Do you have access to these or need alternatives?',
      'Who should be involved? I suggest these people. Are there others I\'m missing?',
      'Potential challenges I see. How can we address these?',
      'Success metrics I suggest. Do these align with your expectations?'
    ]
  }
}

export async function reviewTaskCreation(
  taskData: TaskCreationData,
  existingCalendar?: any[]
): Promise<TaskReviewResult> {
  const prompt = `
You are an expert project manager and AI assistant helping to create comprehensive project breakdowns. Your goal is to ask probing questions and create detailed tasks that will ensure the project is completed successfully.

Project Information:
- Title: ${taskData.title}
- Due Date: ${taskData.dueDate || 'Not specified'}
- Category: ${taskData.category || 'Not specified'}
- Success Criteria: ${taskData.successCriteria || 'Not specified'}
- Context: ${taskData.context || 'Not specified'}
${taskData.clarifyingAnswers ? `- Clarifying Answers: ${JSON.stringify(taskData.clarifyingAnswers, null, 2)}` : ''}

${existingCalendar ? `Calendar Events: ${JSON.stringify(existingCalendar)}` : ''}

IMPORTANT: Think of this as a PROJECT with individual TASKS underneath. 

${taskData.clarifyingAnswers ? 
  'The user has provided clarifying answers. Use this information to create a more detailed and accurate project plan with specific tasks, realistic timelines, and comprehensive coverage.' :
  'Ask deep, probing questions to understand: 1. What are the specific deliverables? 2. Who are the stakeholders involved? 3. What resources are needed? 4. What are the dependencies and prerequisites? 5. What could go wrong? 6. What quality standards need to be met? 7. What is the acceptance criteria for each deliverable?'
}

Please provide:
1. A suggested project name that incorporates the details and goals
2. Suggestions for improving the project definition and making it more specific
3. Detailed clarifying questions to better understand the requirements, scope, and context
4. Estimated total duration (in minutes) - be realistic and include buffer time
5. Project complexity assessment (low/medium/high)
6. Comprehensive tasks that break down the project into manageable pieces
7. Potential risks, blockers, and mitigation strategies
8. Calendar conflict analysis (if calendar data provided)

For tasks, consider:
- Research and planning phases
- Design and preparation
- Execution and implementation
- Testing and validation
- Review and refinement
- Documentation and handoff

Format your response as JSON:
{
  "suggestedProjectName": "A descriptive, professional project name",
  "suggestions": [
    {
      "suggestion": "I'd suggest you determine the specific type of chair using photos or inspiration",
      "category": "scope|resources|approach|timeline|quality"
    }
  ],
  "clarifyingQuestions": [
    "What specific deliverables are expected?",
    "Who are the key stakeholders and what are their requirements?",
    "What resources (tools, people, budget) are available?",
    "What are the dependencies or prerequisites?",
    "What quality standards or criteria need to be met?",
    "What could potentially block or delay this project?",
    "How will success be measured beyond the stated criteria?"
  ],
  "estimatedDuration": 120,
  "complexity": "medium",
  "recommendedSubtasks": [
    {
      "title": "Task title",
      "description": "Detailed description of what needs to be done",
      "estimatedTime": 30,
      "suggestedDueDate": "2024-01-15",
      "priority": "high",
      "dependencies": ["other task"]
    }
  ],
  "toolsAndSupplies": {
    "tools": ["Tool 1", "Tool 2"],
    "materials": ["Material 1", "Material 2"],
    "safety": ["Safety item 1", "Safety item 2"]
  },
  "potentialRisks": ["risk1", "risk2"],
  "calendarConflicts": [
    {
      "date": "2024-01-15",
      "conflictType": "meeting",
      "description": "Team meeting at 2 PM"
    }
  ]
}

Focus on creating a complete project plan with realistic time estimates and comprehensive coverage of all aspects needed for success.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error reviewing task creation:', error)
    return {
      suggestions: [],
      clarifyingQuestions: [],
      estimatedDuration: 60,
      complexity: 'medium',
      recommendedSubtasks: [],
      potentialRisks: [],
      calendarConflicts: []
    }
  }
}

export async function generateSubtasksWithDates(
  taskTitle: string,
  taskDescription: string,
  dueDate: string,
  workingHours: { start: number; end: number },
  preferredDays: number[]
): Promise<Array<{
  title: string
  description?: string
  estimatedTime: number
  suggestedDueDate: string
  priority: 'low' | 'medium' | 'high'
  dependencies?: string[]
}>> {
  const prompt = `
You are an AI assistant creating a detailed task breakdown with realistic due dates.

Task: ${taskTitle}
Description: ${taskDescription}
Final Due Date: ${dueDate}
Working Hours: ${workingHours.start}:00 - ${workingHours.end}:00
Preferred Days: ${preferredDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}

Please create 3-8 subtasks with:
- Specific, actionable titles
- Realistic time estimates
- Suggested due dates that work backwards from the final due date
- Appropriate priorities
- Any dependencies between subtasks

Consider:
- Working hours and preferred days
- Buffer time for unexpected issues
- Logical task progression
- Realistic time estimates

Format your response as JSON array:
[
  {
    "title": "Subtask title",
    "description": "Brief description",
    "estimatedTime": 30,
    "suggestedDueDate": "2024-01-15",
    "priority": "high",
    "dependencies": ["other subtask title"]
  }
]

Ensure suggested due dates are within working hours and preferred days.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating subtasks with dates:', error)
    return []
  }
}

export async function checkCalendarConflicts(
  suggestedDates: string[],
  calendarEvents: any[]
): Promise<Array<{
  date: string
  conflictType: 'busy' | 'vacation' | 'meeting'
  description: string
  severity: 'low' | 'medium' | 'high'
}>> {
  const prompt = `
You are analyzing calendar conflicts for suggested task dates.

Suggested Dates: ${JSON.stringify(suggestedDates)}
Calendar Events: ${JSON.stringify(calendarEvents)}

Please identify any conflicts between the suggested dates and existing calendar events.
Consider:
- Time overlaps
- Travel time between events
- Energy levels (don't schedule intensive tasks after long meetings)
- Buffer time needed

Format your response as JSON array:
[
  {
    "date": "2024-01-15",
    "conflictType": "meeting",
    "description": "Team meeting at 2 PM conflicts with 3-hour task",
    "severity": "high"
  }
]

Conflict types: "busy", "vacation", "meeting"
Severity levels: "low", "medium", "high"
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error checking calendar conflicts:', error)
    return []
  }
}

export async function analyzeProjectIntelligence(
  projectData: {
    title: string
    tasks: Array<{
      title: string
      estimatedTime: number
      priority: string
      dependencies?: string[]
    }>
    dueDate: string
    categorySchedules: Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
    }>
    calendarEvents?: any[]
  }
): Promise<{
  optimizedSchedule: Array<{
    taskId: string
    suggestedStartDate: string
    suggestedEndDate: string
    reason: string
  }>
  criticalPath: string[]
  riskAssessment: Array<{
    risk: string
    probability: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    mitigation: string
  }>
  efficiencySuggestions: string[]
  timeOptimization: {
    totalOptimizedTime: number
    timeSaved: number
    recommendations: string[]
  }
}> {
  const prompt = `
You are an expert project management AI analyzing a project for optimal execution.

Project: ${projectData.title}
Due Date: ${projectData.dueDate}
Available Hours: ${JSON.stringify(projectData.categorySchedules)}

Tasks:
${projectData.tasks.map(task => `
- ${task.title} (${task.estimatedTime}min, ${task.priority} priority)
  Dependencies: ${task.dependencies?.join(', ') || 'None'}
`).join('')}

${projectData.calendarEvents ? `Calendar Events: ${JSON.stringify(projectData.calendarEvents)}` : ''}

Please provide:
1. Optimized schedule considering dependencies, priority, and available time slots
2. Critical path analysis
3. Risk assessment with mitigation strategies
4. Efficiency suggestions
5. Time optimization recommendations

Format as JSON:
{
  "optimizedSchedule": [
    {
      "taskId": "task1",
      "suggestedStartDate": "2024-01-15T09:00:00Z",
      "suggestedEndDate": "2024-01-15T11:00:00Z",
      "reason": "High priority, no dependencies, fits in available time slot"
    }
  ],
  "criticalPath": ["task1", "task3", "task5"],
  "riskAssessment": [
    {
      "risk": "Task 3 may take longer than estimated",
      "probability": "medium",
      "impact": "high",
      "mitigation": "Add 20% buffer time and prepare backup resources"
    }
  ],
  "efficiencySuggestions": [
    "Batch similar tasks together",
    "Consider parallel execution for independent tasks"
  ],
  "timeOptimization": {
    "totalOptimizedTime": 480,
    "timeSaved": 120,
    "recommendations": [
      "Use time blocking for focused work",
      "Schedule high-priority tasks during peak productivity hours"
    ]
  }
}
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error analyzing project intelligence:', error)
    throw error
  }
}

export async function getTaskAssistance(
  taskTitle: string,
  taskDescription: string,
  userQuery: string,
  projectContext: string
): Promise<{
  suggestions: string[]
  nextSteps: string[]
  resources: string[]
  warnings: string[]
}> {
  const prompt = `
You are an AI assistant helping a user complete a specific task within a project.

Task: ${taskTitle}
Description: ${taskDescription}
Project Context: ${projectContext}
User Query: ${userQuery}

Provide helpful assistance including:
1. Specific suggestions for completing this task
2. Next steps to take
3. Useful resources or tools
4. Potential warnings or things to watch out for

Format your response as JSON:
{
  "suggestions": ["suggestion1", "suggestion2"],
  "nextSteps": ["step1", "step2"],
  "resources": ["resource1", "resource2"],
  "warnings": ["warning1", "warning2"]
}
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error getting task assistance:', error)
    return {
      suggestions: [],
      nextSteps: [],
      resources: [],
      warnings: []
    }
  }
}

export async function generateProjectInsights(
  projectId: string,
  taskData: any[]
): Promise<{
  productivityPatterns: Array<{
    pattern: string
    insight: string
    recommendation: string
  }>
  timeAnalysis: {
    estimatedVsActual: Array<{
      taskId: string
      estimated: number
      actual: number
      variance: number
    }>
    averageVariance: number
  }
  completionTrends: {
    trend: 'improving' | 'declining' | 'stable'
    reason: string
    suggestions: string[]
  }
}> {
  const prompt = `
Analyze this project data for insights and patterns:

Project Tasks:
${taskData.map(task => `
- ${task.title}
  Status: ${task.status}
  Estimated: ${task.estimatedTime}min
  Actual: ${task.actualTime || 'Not completed'}min
  Priority: ${task.priority}
  Category: ${task.category?.name}
`).join('')}

Provide insights on:
1. Productivity patterns and trends
2. Time estimation accuracy
3. Completion trends and recommendations

Format as JSON with the structure shown in the function return type.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) throw new Error('No response from AI')

    return JSON.parse(response)
  } catch (error) {
    console.error('Error generating project insights:', error)
    throw error
  }
}
