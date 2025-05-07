import React from 'react'
import Calendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventSourceInput } from '@fullcalendar/core'

interface CalendarViewProps {
  events: EventSourceInput
  height?: string
}

export default function CalendarView({ events, height = '300px' }: CalendarViewProps) {
  return (
    <Calendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      events={events}
      height={height}
      firstDay={1}
    />
  )
} 