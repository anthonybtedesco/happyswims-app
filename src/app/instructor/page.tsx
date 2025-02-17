'use client';
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '@/lib/colors';

type TimeRange = {
  id: string;
  splits: {
    id: string;
    startTime: string;
    endTime: string;
  }[];
  color: string;
};

type AvailabilityPattern = {
  id: string;
  timeRangeId: string;
  start: string;
  end: string;
  type: 'days' | 'weeks' | 'months';
};

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEEAD', '#D4A5A5'
];

export default function InstructorDashboard() {
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{
    id: '1',
    splits: [{
      id: uuidv4(),
      startTime: '09:00',
      endTime: '17:00'
    }],
    color: COLORS[0]
  }]);

  const [patterns, setPatterns] = useState<AvailabilityPattern[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('1');
  const [selectedType, setSelectedType] = useState<'days' | 'weeks' | 'months'>('days');

  const addTimeRange = () => {
    const newTimeRange = {
      id: uuidv4(),
      splits: [{
        id: uuidv4(),
        startTime: '09:00',
        endTime: '17:00'
      }],
      color: COLORS[timeRanges.length % COLORS.length]
    };
    setTimeRanges([...timeRanges, newTimeRange]);
  };

  const addTimeSplit = (rangeId: string) => {
    setTimeRanges(timeRanges.map(range => 
      range.id === rangeId 
        ? {
            ...range,
            splits: [...range.splits, {
              id: uuidv4(),
              startTime: '09:00',
              endTime: '17:00'
            }]
          }
        : range
    ));
  };

  const updateTimeSplit = (
    rangeId: string, 
    splitId: string, 
    field: 'startTime' | 'endTime', 
    value: string
  ) => {
    setTimeRanges(timeRanges.map(range => 
      range.id === rangeId 
        ? {
            ...range,
            splits: range.splits.map(split =>
              split.id === splitId 
                ? { ...split, [field]: value }
                : split
            )
          }
        : range
    ));
  };

  const removeTimeSplit = (rangeId: string, splitId: string) => {
    setTimeRanges(timeRanges.map(range => 
      range.id === rangeId 
        ? {
            ...range,
            splits: range.splits.filter(split => split.id !== splitId)
          }
        : range
    ));
  };

  const removeTimeRange = (id: string) => {
    setTimeRanges(timeRanges.filter(range => range.id !== id));
    setPatterns(patterns.filter(pattern => pattern.timeRangeId !== id));
  };

  const computeSelectionDates = (selectInfo: DateSelectArg) => {
    const startDate = new Date(selectInfo.start);
    let endDate = new Date(selectInfo.end);

    console.log('Initial dates:', { startDate, endDate });
    console.log('Selection type:', selectedType);

    switch (selectedType) {
      case 'months': {
        startDate.setDate(1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        console.log('Month selection:', { startDate, endDate });
        break;
      }
      case 'weeks': {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4);
        console.log('Week selection:', { startDate, endDate });
        break;
      }
      case 'days':
      default: {
        if (startDate.getTime() === endDate.getTime()) {
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate());
          console.log('Day selection:', { startDate, endDate });
        }
        break;
      }
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log('Final dates:', { startDate, endDate });
    return { startDate, endDate };
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    const timeRange = timeRanges.find(r => r.id === selectedTimeRange);
    console.log('Selected time range:', timeRange);
    if (!timeRange) return;
    console.log('Selected time range:', timeRange);

    const { startDate, endDate } = computeSelectionDates(selectInfo);

    const newPattern: AvailabilityPattern = {
      id: uuidv4(),
      timeRangeId: selectedTimeRange,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: selectedType
    };

    setPatterns([...patterns, newPattern]);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm('Would you like to delete this availability pattern?')) {
      setPatterns(patterns.filter(pattern => pattern.id !== clickInfo.event.id));
    }
  };

  const removePattern = (patternId: string) => {
    setPatterns(patterns.filter(pattern => pattern.id !== patternId));
  };

  const calendarEvents = patterns.map(pattern => {
    const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
    return {
      id: pattern.id,
      start: pattern.start,
      end: pattern.end,
      backgroundColor: timeRange?.color,
      title: timeRange?.splits.map(split => 
        `${split.startTime} - ${split.endTime}`
      ).join(', '),
      display: 'block'
    };
  });

  const selectionTypes = [
    { value: 'days', label: 'Day Selection' },
    { value: 'weeks', label: 'Week Selection' },
    { value: 'months', label: 'Month Selection' }
  ] as const;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Instructor Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Time Ranges</h2>
            <div className="space-y-6">
              {timeRanges.map(range => (
                <div key={range.id} className="p-4 border rounded space-y-4">
                  <div 
                    className="w-full h-2 rounded-full mb-4" 
                    style={{ backgroundColor: range.color }}
                  />
                  {range.splits.map(split => (
                    <div key={split.id} className="flex items-center gap-4">
                      <input
                        type="time"
                        value={split.startTime}
                        onChange={(e) => updateTimeSplit(range.id, split.id, 'startTime', e.target.value)}
                        className="p-2 border rounded"
                        style={{ backgroundColor: colors.common.white }}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={split.endTime}
                        onChange={(e) => updateTimeSplit(range.id, split.id, 'endTime', e.target.value)}
                        className="p-2 border rounded"
                        style={{ backgroundColor: colors.common.white, colorScheme: 'dark' }}

                      />
                      {range.splits.length > 1 && (
                        <button
                          onClick={() => removeTimeSplit(range.id, split.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          Remove Split
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-4">
                    <button
                      onClick={() => addTimeSplit(range.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Add Split
                    </button>
                    <button
                      onClick={() => removeTimeRange(range.id)}
                      className="text-red-500 hover:text-red-700 px-4 py-2"
                    >
                      Remove Range
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addTimeRange}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Time Range
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Set Availability</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Select Time Range</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {timeRanges.map(range => (
                    <option key={range.id} value={range.id}>
                      {range.splits.map(split => 
                        `${split.startTime} - ${split.endTime}`
                      ).join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Selection Type</label>
                <div className="flex gap-2">
                  {selectionTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`flex-1 px-4 py-2 rounded transition-colors ${
                        selectedType === type.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <div className="text-sm text-gray-600">
              Current Mode: {selectionTypes.find(t => t.value === selectedType)?.label}
            </div>
          </div>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={calendarEvents}
            select={handleSelect}
            eventClick={handleEventClick}
            height="auto"
            firstDay={1}
            selectConstraint={{
              start: '00:00',
              end: '24:00',
              daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
            }}
            selectOverlap={true}
            unselectAuto={false}
            selectMinDistance={0}
            selectLongPressDelay={0}
            longPressDelay={0}
            eventDisplay="block"
            selectAllow={(selectInfo) => {
              const start = new Date(selectInfo.start);
              const end = new Date(selectInfo.end);

              console.log('Start date:', start);
              console.log('End date:', end);
              
              if (selectedType === 'months') {
                return start.getDate() <= 7;
              }
              if (selectedType === 'weeks') {
                return start.getDay() === 1;
              }
              return true;
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Saved Patterns</h2>
        <div className="space-y-2">
          {patterns.map((pattern) => {
            const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
            return (
              <div 
                key={pattern.id} 
                className="p-4 border rounded flex justify-between items-center"
                style={{ borderLeftColor: timeRange?.color, borderLeftWidth: '4px' }}
              >
                <div>
                  <p>Time: {timeRange?.splits.map(split => 
                    `${split.startTime} - ${split.endTime}`
                  ).join(', ')}</p>
                  <p>Type: {pattern.type}</p>
                  <p>Date Range: {new Date(pattern.start).toLocaleDateString()} - {new Date(pattern.end).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => removePattern(pattern.id)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}