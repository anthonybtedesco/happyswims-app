'use client';

import React from 'react';
import { format, parse, addMinutes } from 'date-fns';

interface TimeSelectProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  duration: number;
  disabled?: boolean;
}

export default function TimeSelect({
  selectedTime,
  onTimeSelect,
  duration,
  disabled = false
}: TimeSelectProps) {
  // Generate time slots every 15 minutes from 6 AM to 8 PM
  const generateTimeSlots = () => {
    const slots = [];
    const startTime = parse('06:00', 'HH:mm', new Date());
    const endTime = parse('20:00', 'HH:mm', new Date());
    let currentTime = startTime;

    while (currentTime <= endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 15);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getEndTime = (startTime: string) => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = addMinutes(start, duration);
    return format(end, 'HH:mm');
  };

  return (
    <div>
      <style jsx>{`
        .time-select-container {
          display: grid;
          gap: 1rem;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .time-slot {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background-color: white;
        }

        .time-slot:hover:not(.disabled) {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .time-slot.selected {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .time-slot.disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .selected-time-display {
          padding: 0.75rem;
          background-color: #f3f4f6;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .time-range {
          font-weight: 500;
          color: #1f2937;
        }

        .duration {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      `}</style>

      <div className="time-select-container">
        {selectedTime && (
          <div className="selected-time-display">
            <div className="time-range">
              {format(parse(selectedTime, 'HH:mm', new Date()), 'h:mm a')} - {' '}
              {format(parse(getEndTime(selectedTime), 'HH:mm', new Date()), 'h:mm a')}
            </div>
            <div className="duration">
              Duration: {duration} minutes
            </div>
          </div>
        )}

        <div className="time-grid">
          {timeSlots.map((time) => {
            const isSelected = time === selectedTime;
            const endTime = getEndTime(time);
            const isValidEndTime = endTime <= '20:00'; // Ensure lesson ends before 8 PM

            return (
              <div
                key={time}
                className={`time-slot ${isSelected ? 'selected' : ''} ${
                  disabled || !isValidEndTime ? 'disabled' : ''
                }`}
                onClick={() => {
                  if (!disabled && isValidEndTime) {
                    onTimeSelect(time);
                  }
                }}
              >
                {format(parse(time, 'HH:mm', new Date()), 'h:mm a')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 