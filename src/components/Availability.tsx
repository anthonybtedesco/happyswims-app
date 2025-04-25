'use client';
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { v4 as uuidv4 } from 'uuid';
import { colors, buttonVariants } from '@/lib/colors';
import { supabase } from '@/lib/supabase/client';

type AvailabilityType = 'days' | 'weeks' | 'months' | 'weekends';

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
  type: AvailabilityType;
};

// Add these database types for instructor availability
type InstructorTimeRange = {
  id: string;
  instructor_id: string;
  color: string;
}

type InstructorTimeSplit = {
  id: string;
  time_range_id: string;
  start_time: string;
  end_time: string;
}

type InstructorAvailability = {
  id: string;
  instructor_id: string;
  time_range_id: string;
  start_date: string;
  end_date: string;
  pattern_type: 'days' | 'weeks' | 'months' | 'weekends';
}

const COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEEAD', // Cream Yellow
  '#D4A5A5', // Dusty Rose
  '#7986CB', // Cornflower Blue
  '#9575CD', // Medium Purple
  '#64B5F6', // Light Blue
  '#4DB6AC', // Teal
  '#81C784', // Light Green
  '#DCE775', // Lime
  '#FFD54F', // Amber
  '#FF8A65', // Light Orange
  '#A1887F', // Brown
  '#90A4AE', // Blue Grey
  '#F06292', // Pink
  '#7E57C2', // Deep Purple
  '#26A69A', // Teal Green
  '#FFA726'  // Orange
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
  const [selectedType, setSelectedType] = useState<'days' | 'weeks' | 'months' | 'weekends'>('days');
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEdited, setIsEdited] = useState(false);

  // Fetch instructor ID on component mount
  useEffect(() => {
    async function fetchInstructorId() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setSaveError('You must be logged in to manage availability');
          return;
        }
        
        // Get instructor ID for the current user
        const { data: instructorData, error: instructorError } = await supabase
          .from('instructor')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (instructorError) {
          console.error('Error fetching instructor:', instructorError);
          setSaveError('Failed to find instructor profile');
          return;
        }
        
        setInstructorId(instructorData.id);
        
        // Load existing availability patterns
        await loadAvailability(instructorData.id);
      } catch (err) {
        console.error('Error in initialization:', err);
        setSaveError('Failed to initialize availability');
      }
    }
    
    fetchInstructorId();
  }, []);

  // Load existing availability from Supabase
  const loadAvailability = async (instructorId: string) => {
    try {
      // Load availability patterns - in your schema, all data is in one table
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('instructor_id', instructorId);
        
      if (availabilityError) throw availabilityError;
      
      if (availabilityData && availabilityData.length > 0) {
        // Process the time ranges from the availability data
        const timeRangeMap = new Map<string, TimeRange>();
        
        // Create time ranges from the availability data
        availabilityData.forEach(item => {
          // Create a unique ID for each unique timerange string
          const timeRangeId = item.id; // Using the availability ID as the time range ID
          
          if (!timeRangeMap.has(timeRangeId)) {
            // Parse timerange string into splits
            const splits = (item.timerange || '').split(',').map((timeStr: string) => {
              const [startTime, endTime] = timeStr.split('-');
              return {
                id: uuidv4(),
                startTime: startTime || '09:00',
                endTime: endTime || '17:00'
              };
            });
            
            // If no valid splits were parsed, create a default one
            if (splits.length === 0) {
              splits.push({
                id: uuidv4(),
                startTime: '09:00',
                endTime: '17:00'
              });
            }
            
            timeRangeMap.set(timeRangeId, {
              id: timeRangeId,
              color: COLORS[timeRangeMap.size % COLORS.length],
              splits
            });
          }
        });
        
        // Convert the map to an array
        const ranges = Array.from(timeRangeMap.values());
        
        if (ranges.length > 0) {
          setTimeRanges(ranges);
          setSelectedTimeRange(ranges[0].id);
        }
        
        // Create patterns from the availability data
        setPatterns(availabilityData.map(item => ({
          id: item.id,
          timeRangeId: item.id, // Using the availability ID as the time range ID
          start: item.start_date,
          end: item.end_date,
          type: (item.pattern_type as AvailabilityType) || 'days'
        })));
      }
    } catch (err: any) {
      console.error('Error loading availability:', err);
      setSaveError('Failed to load existing availability');
    }
  };

  // Save availability to Supabase
  const saveAvailability = async () => {
    if (!instructorId) {
      setSaveError('Instructor profile not found');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // First clear existing availability data
      await supabase
        .from('availability')
        .delete()
        .eq('instructor_id', instructorId);
      
      // Save availability patterns directly - your schema has a single 'availability' table
      for (const pattern of patterns) {
        const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
        if (!timeRange) continue;
        
        // Create a separate availability entry for each time split
        for (const split of timeRange.splits) {
          const timeRangeStr = `${split.startTime}-${split.endTime}`;
          
          await supabase
            .from('availability')
            .insert({
              id: uuidv4(), // Generate a new ID for each availability entry
              instructor_id: instructorId,
              start_date: pattern.start,
              end_date: pattern.end,
              timerange: timeRangeStr,
              color: timeRange.color
            });
        }
      }
      
      setSaveSuccess(true);
      setIsEdited(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setSaveError(err.message || 'Failed to save availability');
    } finally {
      setIsSaving(false);
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
    setIsEdited(true);
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
    setIsEdited(true);
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
    setIsEdited(true);
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
    setIsEdited(true);
  };

  const removeTimeRange = (id: string) => {
    setTimeRanges(timeRanges.filter(range => range.id !== id));
    setPatterns(patterns.filter(pattern => pattern.timeRangeId !== id));
    setIsEdited(true);
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
    console.log('Checking for overlapping patterns between:', start, 'and', end);
    const overlappingPatterns = patterns.filter(pattern => {
      const patternStart = new Date(pattern.start);
      const patternEnd = new Date(pattern.end);
      console.log('Checking pattern:', pattern.id);
      console.log('Pattern start:', patternStart);
      console.log('Pattern end:', patternEnd);
      const hasOverlap = (
        (start <= patternEnd && start >= patternStart) ||
        (end <= patternEnd && end >= patternStart) ||
        (start <= patternStart && end >= patternEnd)
      );
      console.log('Has overlap:', hasOverlap);
      return hasOverlap;
    });

    console.log('Found overlapping patterns:', overlappingPatterns.length);
    if (overlappingPatterns.length === 0) return false;

    const allContained = overlappingPatterns.every(pattern => {
      const patternStart = new Date(pattern.start);
      console.log('Checking if pattern is contained:', pattern.id);
      console.log('Pattern start:', patternStart);
      const isContained = start <= patternStart && end >= patternStart;
      console.log('Is contained:', isContained);
      return isContained;
    });

    console.log('All patterns contained:', allContained);
    if (allContained) {
      console.log('Removing contained patterns');
      setPatterns(patterns.filter(pattern => 
        !overlappingPatterns.some(op => op.id === pattern.id)
      ));
      return false;
    }

    return true;
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    const timeRange = timeRanges.find(r => r.id === selectedTimeRange);
    if (!timeRange) return;
    const { startDate, endDate } = computeSelectionDates(selectInfo);

    if (hasOverlap(startDate, endDate)) {
      alert('This time period overlaps with existing availability. Please select a different period.');
      selectInfo.view.calendar.unselect();
      return;
    }


    console.log('Adding new pattern:', { startDate, endDate, selectedType });

    const newPattern: AvailabilityPattern = {
      id: uuidv4(),
      timeRangeId: selectedTimeRange,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: selectedType
    };

    setPatterns([...patterns, newPattern]);
    setIsEdited(true);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    if (confirm('Would you like to delete this availability pattern?')) {
      setPatterns(patterns.filter(pattern => pattern.id !== clickInfo.event.id));
      setIsEdited(true);
    }
  };

  const removePattern = (patternId: string) => {
    setPatterns(patterns.filter(pattern => pattern.id !== patternId));
    setIsEdited(true);
  };

  const clearAllPatterns = () => {
    if (confirm('Are you sure you want to delete all patterns?')) {
      setPatterns([]);
      setIsEdited(true);
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
    <div style={{ padding: '1.5rem' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '2rem',
      }}>
        <div className="md:grid md:grid-cols-2 md:gap-8">
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem' 
              }}>
                Time Ranges
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {timeRanges.map(range => (
                  <div key={range.id} style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div 
                      style={{ 
                        width: '100%', 
                        height: '0.5rem', 
                        borderRadius: '0.25rem', 
                        marginBottom: '1rem',
                        backgroundColor: range.color 
                      }}
                    />
                    {range.splits.map(split => (
                      <div key={split.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem' 
                      }}>
                        <input
                          type="time"
                          value={split.startTime}
                          onChange={(e) => updateTimeSplit(range.id, split.id, 'startTime', e.target.value)}
                          style={{ 
                            padding: '0.5rem', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            backgroundColor: colors.common.white
                          }}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={split.endTime}
                          onChange={(e) => updateTimeSplit(range.id, split.id, 'endTime', e.target.value)}
                          style={{ 
                            padding: '0.5rem', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            backgroundColor: colors.common.white
                          }}
                        />
                        {range.splits.length > 1 && (
                          <button
                            onClick={() => removeTimeSplit(range.id, split.id)}
                            style={{ 
                              padding: '0.5rem', 
                              color: '#ef4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Remove Split
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => addTimeSplit(range.id)}
                        style={{ 
                          backgroundColor: '#3b82f6', 
                          color: 'white', 
                          padding: '0.5rem 1rem', 
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Add Split
                      </button>
                      <button
                        onClick={() => removeTimeRange(range.id)}
                        style={{ 
                          color: '#ef4444', 
                          padding: '0.5rem 1rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Remove Range
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addTimeRange}
                  style={{ 
                    backgroundColor: '#10b981', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
                >
                  Add Time Range
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                marginBottom: '1rem' 
              }}>
                Set Availability
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem',
                    fontWeight: '500'
                  }}>
                    Select Time Range
                  </label>
                  <div style={{
                    position: 'relative',
                    width: '100%'
                  }}>
                    <select
                      value={selectedTimeRange}
                      onChange={(e) => setSelectedTimeRange(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        paddingLeft: '2.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        appearance: 'none',
                        backgroundColor: colors.common.white,
                        cursor: 'pointer'
                      }}
                    >
                      {timeRanges.map(range => (
                        <option key={range.id} value={range.id}>
                          {range.splits.map(split => 
                            `${split.startTime} - ${split.endTime}`
                          ).join(', ')}
                        </option>
                      ))}
                    </select>
                    <div style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '1rem',
                      height: '1rem',
                      borderRadius: '0.25rem',
                      backgroundColor: timeRanges.find(r => r.id === selectedTimeRange)?.color || COLORS[0]
                    }} />
                    <div style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: colors.text.secondary,
                    marginTop: '0.5rem'
                  }}>
                    Select a time range before choosing dates on the calendar
                  </p>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem'
                  }}>
                    Selection Type
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {selectionTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 1rem', 
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: selectedType === type.value ? '#3b82f6' : '#f3f4f6',
                          color: selectedType === type.value ? 'white' : '#4b5563',
                          transition: 'all 0.2s'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <div style={{ marginBottom: '2rem' }}>
              <button
                onClick={saveAvailability}
                disabled={isSaving || !instructorId}
                style={{
                  ...buttonVariants.primary,
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  cursor: isSaving || !instructorId ? 'not-allowed' : 'pointer',
                  opacity: isSaving || !instructorId ? 0.7 : 1
                }}
              >
                {isSaving ? 'Saving...' : 'Save Availability'}
              </button>
              
              {saveSuccess && (
                <div style={{
                  padding: '0.75rem',
                  marginTop: '1rem',
                  borderRadius: '0.375rem',
                  backgroundColor: colors.status.success + '20',
                  color: colors.status.success
                }}>
                  Availability saved successfully!
                </div>
              )}
              
              {saveError && (
                <div style={{
                  padding: '0.75rem',
                  marginTop: '1rem',
                  borderRadius: '0.375rem',
                  backgroundColor: colors.status.error + '20',
                  color: colors.status.error
                }}>
                  {saveError}
                </div>
              )}
              
              {!instructorId && !saveError && (
                <div style={{
                  padding: '0.75rem',
                  marginTop: '1rem',
                  borderRadius: '0.375rem',
                  backgroundColor: colors.status.warning + '20',
                  color: colors.status.warning
                }}>
                  You must register as an instructor before setting availability.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '0.5rem' 
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280' 
              }}>
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
                  return start.getDay() >= 1 && start.getDay() <= 5;
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem' 
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600'
            }}>
              Saved Patterns
            </h2>
            <button
              onClick={clearAllPatterns}
              style={{ 
                backgroundColor: '#ef4444', 
                color: 'white', 
                padding: '0.5rem 1rem', 
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Delete All Patterns
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {patterns.map((pattern) => {
              const timeRange = timeRanges.find(r => r.id === pattern.timeRangeId);
              return (
                <div 
                  key={pattern.id} 
                  style={{ 
                    padding: '1rem', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeftColor: timeRange?.color,
                    borderLeftWidth: '4px'
                  }}
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
                    style={{ 
                      padding: '0.5rem', 
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isEdited && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <button
            onClick={saveAvailability}
            disabled={isSaving || !instructorId}
            style={{
              backgroundColor: colors.status.success,
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '2rem',
              border: 'none',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              cursor: isSaving || !instructorId ? 'not-allowed' : 'pointer',
              opacity: isSaving || !instructorId ? 0.7 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {saveSuccess && (
            <div style={{
              padding: '0.5rem 1rem',
              borderRadius: '1rem',
              backgroundColor: 'white',
              color: colors.status.success,
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}>
              Saved!
            </div>
          )}
        </div>
      )}
    </div>
  );
}