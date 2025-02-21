'use client';
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { v4 as uuidv4 } from 'uuid';
import { colors } from '@/lib/colors';
import { supabase } from '@/lib/supbase/client';

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
  type: 'days' | 'weeks' | 'months' | 'weekends';
};

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEEAD', '#D4A5A5'
];

const timeToBlocks = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 4) + Math.floor(minutes / 15);
};

const blocksToTime = (blocks: number) => {
  const hours = Math.floor(blocks / 4);
  const minutes = (blocks % 4) * 15;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const TimeRangeSelector = ({ 
  timeRange, 
  onUpdate 
}: { 
  timeRange: TimeRange, 
  onUpdate: (bits: string) => void 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState<'0' | '1'>('1');
  const [bits, setBits] = useState(() => {
    const initialBits = new Array(96).fill('0');
    timeRange.splits.forEach(split => {
      const startBlocks = timeToBlocks(split.startTime);
      const endBlocks = timeToBlocks(split.endTime);
      for (let i = startBlocks; i < endBlocks; i++) {
        initialBits[i] = '1';
      }
    });
    return initialBits;
  });

  const handleMouseDown = (index: number) => {
    setIsDragging(true);
    const newValue = bits[index] === '1' ? '0' : '1';
    setDragValue(newValue as '0' | '1');
    const newBits = [...bits];
    newBits[index] = newValue;
    setBits(newBits);
    onUpdate(newBits.join(''));
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging) {
      const newBits = [...bits];
      newBits[index] = dragValue;
      setBits(newBits);
      onUpdate(newBits.join(''));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Group bits into 6-hour chunks (24 blocks each)
  const timeChunks = Array.from({ length: 4 }, (_, i) => i * 24);

  return (
    <div className="space-y-2">
      {timeChunks.map(startBlock => (
        <div key={startBlock} className="flex items-start gap-1">
          <span className="text-xs text-gray-500 w-8 mt-1.5">
            {Math.floor(startBlock / 4).toString().padStart(2, '0')}:00
          </span>
          <div className="flex flex-col gap-1">
            {/* Row of dots */}
            <div className="flex items-center gap-1">
              {bits.slice(startBlock, startBlock + 24).map((bit, index) => {
                const actualIndex = startBlock + index;
                const hour = Math.floor(actualIndex / 4);
                const minute = (actualIndex % 4) * 15;
                const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                
                return (
                  <div 
                    key={actualIndex} 
                    className="w-3"
                    onMouseDown={() => handleMouseDown(actualIndex)}
                    onMouseEnter={() => handleMouseEnter(actualIndex)}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${bit === '1' ? 'bg-blue-500' : 'bg-gray-200'} 
                        transition-all duration-200 hover:scale-110 cursor-pointer`}
                      title={timeLabel}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Row of numbers */}
            <div className="flex items-center gap-1">
              {bits.slice(startBlock, startBlock + 24).map((_, index) => {
                const actualIndex = startBlock + index;
                const hour = Math.floor(actualIndex / 4);
                
                return (
                  <div key={actualIndex} className="w-3">
                    {index % 4 === 0 && (
                      <span className="text-xs text-gray-500">
                        {hour.toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

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
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(() => timeRanges[0].id);
  const [selectedType, setSelectedType] = useState<'days' | 'weeks' | 'months' | 'weekends'>('days');
  const [instructor, setInstructor] = useState<any | null>(null);

  useEffect(() => {
    const fetchInstructor = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: instructor, error } = await supabase
        .from('instructor')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching instructor:', error);
        return;
      }

      setInstructor(instructor);
    };

    fetchInstructor();
    loadAvailability();
  }, []);

  useEffect(() => {
    if (timeRanges.length > 0 && !timeRanges.some(tr => tr.id === selectedTimeRange)) {
      setSelectedTimeRange(timeRanges[0].id);
    }
  }, [timeRanges, selectedTimeRange]);

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const loadedPatterns = data.map(item => ({
          id: item.id,
          timeRangeId: item.instructor_id,
          start: item.start_date,
          end: item.end_date,
          type: 'days' as const
        }));

        const loadedTimeRanges = data.reduce<TimeRange[]>((acc, item) => {
          if (!acc.some(r => r.id === item.instructor_id)) {
            const timeRange = {
              id: item.instructor_id,
              splits: decodeBytea(item.timerange),
              color: item.color
            };
            acc.push(timeRange);
          }
          return acc;
        }, []);

        setPatterns(loadedPatterns);
        if (loadedTimeRanges.length > 0) {
          setTimeRanges(loadedTimeRanges);
        }
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      alert('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const encodeSplitsToBytea = (splits: { startTime: string; endTime: string }[]) => {
    const bits = new Array(96).fill('0');
    
    splits.forEach(split => {
      const startBlocks = timeToBlocks(split.startTime);
      const endBlocks = timeToBlocks(split.endTime);
      
      for (let i = startBlocks; i < endBlocks; i++) {
        bits[i] = '1';
      }
    });
    
    return bits.join('');
  };

  const decodeBytea = (timerange: string) => {
    const bits = timerange.split('');
    const splits: { id: string; startTime: string; endTime: string }[] = [];
    let start = -1;
    
    for (let i = 0; i <= bits.length; i++) {
      if (i < bits.length && bits[i] === '1' && start === -1) {
        start = i;
      } else if ((i === bits.length || bits[i] === '0') && start !== -1) {
        splits.push({
          id: uuidv4(),
          startTime: blocksToTime(start),
          endTime: blocksToTime(i)
        });
        start = -1;
      }
    }
    
    return splits;
  };

  const saveAvailability = async () => {
    try {
      // Delete existing availability
      await supabase
        .from('availability')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      // Insert new availability
      const availabilityData = patterns.map(pattern => {
        const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
        return {
          instructor_id: instructor.id,
          start_date: pattern.start,
          end_date: pattern.end,
          timerange: encodeSplitsToBytea(timeRange?.splits || []),
          color: timeRange?.color || COLORS[0]
        };
      });

      const { error } = await supabase
        .from('availability')
        .insert(availabilityData);

      if (error) throw error;
      alert('Availability saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability');
    }
  };

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

  const removeTimeRange = (id: string) => {
    setTimeRanges(timeRanges.filter(range => range.id !== id));
    setPatterns(patterns.filter(pattern => pattern.timeRangeId !== id));
  };

  const computeSelectionDates = (selectInfo: DateSelectArg) => {
    const startDate = new Date(selectInfo.start);
    let endDate = new Date(selectInfo.end);

    switch (selectedType) {
      case 'months': {
        startDate.setDate(1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      }
      case 'weeks': {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4);
        break;
      }
      case 'weekends': {
        const day = startDate.getDay();
        if (day === 6) { // Saturday
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
        } else if (day === 0) { // Sunday
          startDate.setDate(startDate.getDate() - 1);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);
        }
        break;
      }
      case 'days':
      default: {
        endDate = new Date(startDate);
        break;
      }
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  };

  const hasOverlap = (start: Date, end: Date) => {
    const overlappingPatterns = patterns.filter(pattern => {
      const patternStart = new Date(pattern.start);
      const patternEnd = new Date(pattern.end);
      return (
        (start <= patternEnd && start >= patternStart) ||
        (end <= patternEnd && end >= patternStart) ||
        (start <= patternStart && end >= patternEnd)
      );
    });

    if (overlappingPatterns.length === 0) return false;

    // Split overlapping patterns
    overlappingPatterns.forEach(pattern => {
      const patternStart = new Date(pattern.start);
      const patternEnd = new Date(pattern.end);

      // Remove the original pattern
      setPatterns(prev => prev.filter(p => p.id !== pattern.id));

      // Create before pattern if needed
      if (start > patternStart) {
        const beforePattern: AvailabilityPattern = {
          id: uuidv4(),
          timeRangeId: pattern.timeRangeId,
          start: patternStart.toISOString(),
          end: new Date(start.getTime() - 1).toISOString(),
          type: pattern.type
        };
        setPatterns(prev => [...prev, beforePattern]);
      }

      // Create after pattern if needed
      if (end < patternEnd) {
        const afterPattern: AvailabilityPattern = {
          id: uuidv4(),
          timeRangeId: pattern.timeRangeId,
          start: new Date(end.getTime() + 1).toISOString(),
          end: patternEnd.toISOString(),
          type: pattern.type
        };
        setPatterns(prev => [...prev, afterPattern]);
      }
    });

    return false;
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    const timeRange = timeRanges.find(r => r.id === selectedTimeRange);
    if (!timeRange || timeRange.splits.length === 0) {
      alert('Please select a valid time range first');
      selectInfo.view.calendar.unselect();
      return;
    }

    const { startDate, endDate } = computeSelectionDates(selectInfo);

    // Check for overlap and handle splitting
    if (hasOverlap(startDate, endDate)) {
      selectInfo.view.calendar.unselect();
      return;
    }

    const newPattern: AvailabilityPattern = {
      id: uuidv4(),
      timeRangeId: selectedTimeRange,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: selectedType
    };

    setPatterns(prev => [...prev, newPattern]);
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

  const clearAllPatterns = () => {
    if (confirm('Are you sure you want to delete all patterns?')) {
      setPatterns([]);
    }
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
    { value: 'months', label: 'Month Selection' },
    { value: 'weekends', label: 'Weekend Selection' }
  ] as const;

  useEffect(() => {
    
    console.log('Patterns:', patterns);
    const optimizePatterns = () => {
      const sortedPatterns = [...patterns].sort((a, b) => 
        new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      let optimized = false;
      for (let i = 0; i < sortedPatterns.length - 1; i++) {
        console.log('Optimizing patterns:', { i, sortedPatterns });
        const current = sortedPatterns[i];
        const next = sortedPatterns[i + 1];

        if (current.timeRangeId === next.timeRangeId) {
          const currentEnd = new Date(current.end);
          const nextStart = new Date(next.start);
          const nextEnd = new Date(next.end);
          
          if (currentEnd.getTime() >= nextStart.getTime() - 86400000) {
            const mergedPattern = {
              id: current.id,
              timeRangeId: current.timeRangeId,
              start: current.start,
              end: currentEnd.getTime() > nextEnd.getTime() ? current.end : next.end,
              type: current.type
            };
            
            sortedPatterns.splice(i, 2, mergedPattern);
            optimized = true;
            break;
          }
        }
      }

      if (optimized) {
        console.log('Patterns optimized:', sortedPatterns);
        setPatterns(sortedPatterns);
      }
    };

    console.log('Running pattern optimization');
    optimizePatterns();
  }, [patterns]);

  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
        <button
          onClick={saveAvailability}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Save Availability
        </button>
      </div>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-8">
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
                      <TimeRangeSelector
                        timeRange={range}
                        onUpdate={(newTimerange) => {
                          const splits = decodeBytea(newTimerange);
                          setTimeRanges(timeRanges.map(r =>
                            r.id === range.id ? { ...r, splits } : r
                          ));
                        }}
                      />
                      <div className="flex gap-4">
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
                  end: '00:00',
                  daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
                }}
                selectOverlap={false}
                unselectAuto={false}
                selectMinDistance={0}
                selectLongPressDelay={0}
                longPressDelay={0}
                eventDisplay="block"
                selectAllow={(selectInfo) => {
                  const start = new Date(selectInfo.start);
                  const end = new Date(selectInfo.end);
                  
                  if (selectedType === 'months') {
                    return start.getDate() <= 7;
                  }
                  if (selectedType === 'weeks') {
                    return start.getDay() === 1;
                  }
                  if (selectedType === 'weekends') {
                    return start.getDay() === 6 || start.getDay() === 0;
                  }
                  return true;
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Saved Patterns</h2>
              <button
                onClick={clearAllPatterns}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete All Patterns
              </button>
            </div>
            <div className="space-y-2">
              {patterns.map((pattern) => {
                const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
                const timeBlocks = encodeSplitsToBytea(timeRange?.splits || []).split('');
                
                return (
                  <div 
                    key={pattern.id} 
                    className="p-4 border rounded flex flex-col gap-4"
                    style={{ borderLeftColor: timeRange?.color, borderLeftWidth: '4px' }}
                  >
                    <div>
                      <p>Time: {timeRange?.splits.map(split => 
                        `${split.startTime} - ${split.endTime}`
                      ).join(', ')}</p>
                      <p>Type: {pattern.type}</p>
                      <p>Date Range: {new Date(pattern.start).toLocaleDateString()} - {new Date(pattern.end).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {/* Row of dots */}
                      <div className="flex items-center gap-1">
                        {Array.from({length: 96}).map((_, index) => {
                          const isActive = timeBlocks[index] === '1';
                          return (
                            <div key={index} className="w-3">
                              <div
                                className={`w-3 h-3 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-200'} 
                                  transition-all duration-200 hover:scale-110`}
                                title={`${Math.floor(index/4).toString().padStart(2, '0')}:${((index%4)*15).toString().padStart(2, '0')}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Row of numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({length: 96}).map((_, index) => (
                          <div key={index} className="w-3">
                            {index % 4 === 0 && (
                              <span className="text-xs text-gray-500">
                                {Math.floor(index/4).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => removePattern(pattern.id)}
                      className="self-end p-2 text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}