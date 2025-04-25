'use client';

import React from 'react';
import { format, parse, addMinutes } from 'date-fns';

interface TimeSlot {
  start: string;  // ISO string
  end: string;    // ISO string
  available: boolean;
}

interface TimeSlotSelectProps {
  selectedWeekStart: Date;
  timeSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot | null) => void;
}

export default function TimeSlotSelect({
  selectedWeekStart,
  timeSlots,
  selectedSlot,
  onSlotSelect
}: TimeSlotSelectProps) {
  // Group time slots by day
  const slotsByDay = timeSlots.reduce((acc, slot) => {
    const day = parse(slot.start, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date())
      .toISOString()
      .split('T')[0];
    
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const isSlotSelected = (slot: TimeSlot) => 
    selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;

  return (
    <div>
      <style jsx>{`
        .time-slots-container {
          display: grid;
          gap: 1rem;
        }

        .day-container {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .day-header {
          padding: 0.75rem;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem;
          padding: 0.75rem;
        }

        .time-slot {
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
        }

        .time-slot:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .time-slot.selected {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .time-slot.unavailable {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .time-slot.unavailable:hover {
          border-color: #e5e7eb;
          background-color: #f3f4f6;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: #6b7280;
        }
      `}</style>

      <div className="time-slots-container">
        {Object.keys(slotsByDay).length > 0 ? (
          Object.entries(slotsByDay).map(([day, slots]) => (
            <div key={day} className="day-container">
              <div className="day-header">
                {format(parse(day, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
              </div>
              <div className="slots-grid">
                {slots.map((slot, index) => {
                  const startTime = parse(slot.start, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date());
                  const endTime = parse(slot.end, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date());
                  
                  return (
                    <div
                      key={index}
                      className={`time-slot ${isSlotSelected(slot) ? 'selected' : ''} ${
                        !slot.available ? 'unavailable' : ''
                      }`}
                      onClick={() => {
                        if (slot.available) {
                          onSlotSelect(isSlotSelected(slot) ? null : slot);
                        }
                      }}
                    >
                      {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            No time slots available for the selected week.
          </div>
        )}
      </div>
    </div>
  );
} 