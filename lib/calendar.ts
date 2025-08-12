import { prisma } from './db'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  isAllDay: boolean
  source: 'google' | 'outlook'
}

export interface TimeSlot {
  start: Date
  end: Date
  duration: number // in minutes
  isAvailable: boolean
  conflicts?: CalendarEvent[]
}

export class CalendarManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async getCalendarIntegrations() {
    return await prisma.calendarIntegration.findMany({
      where: { userId: this.userId, isActive: true }
    })
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const integrations = await this.getCalendarIntegrations()
    const events: CalendarEvent[] = []

    for (const integration of integrations) {
      try {
        if (integration.provider === 'google') {
          const googleEvents = await this.fetchGoogleCalendarEvents(integration, startDate, endDate)
          events.push(...googleEvents)
        } else if (integration.provider === 'outlook') {
          const outlookEvents = await this.fetchOutlookCalendarEvents(integration, startDate, endDate)
          events.push(...outlookEvents)
        }
      } catch (error) {
        console.error(`Error fetching ${integration.provider} calendar events:`, error)
      }
    }

    return events
  }

  async findAvailableTimeSlots(
    requiredDuration: number, // in minutes
    startDate: Date,
    endDate: Date,
    categorySchedules: Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
    }>
  ): Promise<TimeSlot[]> {
    const events = await this.getCalendarEvents(startDate, endDate)
    const availableSlots: TimeSlot[] = []

    // Generate time slots based on category schedules
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      const daySchedule = categorySchedules.find(s => s.dayOfWeek === dayOfWeek)

      if (daySchedule) {
        const slots = this.generateTimeSlotsForDay(
          currentDate,
          daySchedule.startHour,
          daySchedule.endHour,
          requiredDuration,
          events
        )
        availableSlots.push(...slots)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return availableSlots.filter(slot => slot.isAvailable)
  }

  private generateTimeSlotsForDay(
    date: Date,
    startHour: number,
    endHour: number,
    requiredDuration: number,
    events: CalendarEvent[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    const slotInterval = 30 // 30-minute intervals

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotInterval) {
        const slotStart = new Date(date)
        slotStart.setHours(hour, minute, 0, 0)

        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + requiredDuration)

        // Check if this slot conflicts with any events
        const conflicts = events.filter(event => 
          this.eventsOverlap(
            { start: slotStart, end: slotEnd },
            { start: event.start, end: event.end }
          )
        )

        const isAvailable = conflicts.length === 0

        slots.push({
          start: slotStart,
          end: slotEnd,
          duration: requiredDuration,
          isAvailable,
          conflicts: isAvailable ? undefined : conflicts
        })
      }
    }

    return slots
  }

  private eventsOverlap(slot: { start: Date; end: Date }, event: { start: Date; end: Date }): boolean {
    return slot.start < event.end && slot.end > event.start
  }

  private async fetchGoogleCalendarEvents(integration: any, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    // This would integrate with Google Calendar API
    // For now, return mock data
    return [
      {
        id: 'google-1',
        title: 'Team Meeting',
        start: new Date(startDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after start
        end: new Date(startDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours after start
        description: 'Weekly team sync',
        isAllDay: false,
        source: 'google' as const
      }
    ]
  }

  private async fetchOutlookCalendarEvents(integration: any, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    // This would integrate with Outlook Calendar API
    // For now, return mock data
    return [
      {
        id: 'outlook-1',
        title: 'Client Call',
        start: new Date(startDate.getTime() + 4 * 60 * 60 * 1000), // 4 hours after start
        end: new Date(startDate.getTime() + 5 * 60 * 60 * 1000), // 5 hours after start
        description: 'Project review call',
        isAllDay: false,
        source: 'outlook' as const
      }
    ]
  }

  async suggestOptimalSchedule(
    taskDuration: number,
    projectDueDate: Date,
    categorySchedules: Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
    }>,
    preferredTimes?: Array<{
      dayOfWeek: number
      startHour: number
      endHour: number
    }>
  ): Promise<{
    suggestedStartDate: Date
    suggestedEndDate: Date
    reason: string
    alternativeSlots: TimeSlot[]
  }> {
    const startDate = new Date()
    const endDate = new Date(projectDueDate)

    // Get available time slots
    const availableSlots = await this.findAvailableTimeSlots(
      taskDuration,
      startDate,
      endDate,
      categorySchedules
    )

    if (availableSlots.length === 0) {
      throw new Error('No available time slots found for this task')
    }

    // Find the optimal slot based on preferences
    let optimalSlot = availableSlots[0]

    if (preferredTimes) {
      const preferredSlots = availableSlots.filter(slot => {
        const dayOfWeek = slot.start.getDay()
        const hour = slot.start.getHours()
        return preferredTimes.some(pref => 
          pref.dayOfWeek === dayOfWeek && 
          hour >= pref.startHour && 
          hour < pref.endHour
        )
      })

      if (preferredSlots.length > 0) {
        optimalSlot = preferredSlots[0]
      }
    }

    // Find alternative slots (next 3 best options)
    const alternativeSlots = availableSlots
      .filter(slot => slot.start !== optimalSlot.start)
      .slice(0, 3)

    return {
      suggestedStartDate: optimalSlot.start,
      suggestedEndDate: optimalSlot.end,
      reason: this.generateSchedulingReason(optimalSlot, preferredTimes),
      alternativeSlots
    }
  }

  private generateSchedulingReason(slot: TimeSlot, preferredTimes?: Array<{ dayOfWeek: number; startHour: number; endHour: number }>): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[slot.start.getDay()]
    const timeString = slot.start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })

    if (preferredTimes) {
      const isPreferred = preferredTimes.some(pref => 
        pref.dayOfWeek === slot.start.getDay() && 
        slot.start.getHours() >= pref.startHour && 
        slot.start.getHours() < pref.endHour
      )

      if (isPreferred) {
        return `Scheduled during your preferred work time on ${dayName} at ${timeString}`
      }
    }

    return `Scheduled on ${dayName} at ${timeString} based on available time and category constraints`
  }
}

export async function createCalendarManager(userId: string): Promise<CalendarManager> {
  return new CalendarManager(userId)
}
