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
