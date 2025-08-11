import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}m`
  }
  
  if (mins === 0) {
    return `${hours}h`
  }
  
  return `${hours}h ${mins}m`
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'text-apple-red'
    case 'HIGH':
      return 'text-apple-orange'
    case 'MEDIUM':
      return 'text-apple-blue'
    case 'LOW':
      return 'text-apple-green'
    default:
      return 'text-apple-gray-500'
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-apple-green'
    case 'IN_PROGRESS':
      return 'text-apple-blue'
    case 'TODO':
      return 'text-apple-gray-500'
    case 'CANCELLED':
      return 'text-apple-red'
    default:
      return 'text-apple-gray-500'
  }
}

export function generateRecurrenceRule(
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  interval: number = 1,
  byDay?: string[],
  endDate?: Date
): string {
  let rule = `FREQ=${frequency};INTERVAL=${interval}`
  
  if (byDay && byDay.length > 0) {
    rule += `;BYDAY=${byDay.join(',')}`
  }
  
  if (endDate) {
    rule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
  }
  
  return rule
}

export function parseRecurrenceRule(rule: string): {
  frequency: string
  interval: number
  byDay?: string[]
  until?: Date
} {
  const parts = rule.split(';')
  const result: any = {}
  
  parts.forEach(part => {
    const [key, value] = part.split('=')
    switch (key) {
      case 'FREQ':
        result.frequency = value
        break
      case 'INTERVAL':
        result.interval = parseInt(value)
        break
      case 'BYDAY':
        result.byDay = value.split(',')
        break
      case 'UNTIL':
        result.until = new Date(value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'))
        break
    }
  })
  
  return result
}

export function calculateNextOccurrence(rule: string, fromDate: Date = new Date()): Date {
  const parsed = parseRecurrenceRule(rule)
  const next = new Date(fromDate)
  
  switch (parsed.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + parsed.interval)
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + (7 * parsed.interval))
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + parsed.interval)
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + parsed.interval)
      break
  }
  
  return next
}
