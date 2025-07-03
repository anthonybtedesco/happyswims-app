'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtime } from '@/hooks/useRealtime';
import styles from './Availability.module.css';
import { Database } from '@/lib/types/supabase';
import TimeOffModal from './TimeOffModal';

type AvailabilityStatus = Database['public']['Enums']['AvailabilityStatus'];

interface TimeRange {
  start: string;
  end: string;
}

interface AvailabilitySlot {
  id: string;
  instructor_id: string;
  day_of_week: number;
  timerange: string;
  status: AvailabilityStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

interface AvailabilityProps {
  instructorId?: string;
}

function Availability({ instructorId }: AvailabilityProps) {
  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: '09:00', end: '17:00' });
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  useRealtime(
    {
      table: 'availability',
      filter: instructorId ? `instructor_id=eq.${instructorId}` : undefined
    },
    {
      onInsert: (payload) => {
        console.log('Realtime: New availability slot inserted', payload.new);
        const newSlot = payload.new as AvailabilitySlot;
        setAvailabilities(prev => [newSlot, ...prev]);
      },
      onUpdate: (payload) => {
        console.log('Realtime: Availability slot updated', payload.new);
        const updatedSlot = payload.new as AvailabilitySlot;
        setAvailabilities(prev => 
          prev.map(slot => 
            slot.id === updatedSlot.id ? updatedSlot : slot
          )
        );
      },
      onDelete: (payload) => {
        console.log('Realtime: Availability slot deleted', payload.old);
        const deletedSlot = payload.old as AvailabilitySlot;
        setAvailabilities(prev => 
          prev.filter(slot => slot.id !== deletedSlot.id)
        );
      },
      onError: (error) => {
        console.error('Realtime error:', error);
        setRealtimeStatus('error');
        setSaveError('Lost connection to realtime updates. Please refresh the page.');
      }
    }
  );

  useEffect(function initialLoad() {
    if (instructorId) {
      loadAvailabilities();
      setRealtimeStatus('connected');
    }
  }, [instructorId]);

  async function loadAvailabilities() {
    if (!instructorId) return;
    
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('day_of_week', { ascending: true })
        .order('timerange', { ascending: true });

      if (error) {
        console.error('Error loading availabilities:', error);
        setSaveError('Failed to load availability data');
        return;
      }

      console.log('Weekly view - Loaded availabilities:', data);
      setAvailabilities(data || []);
      setRealtimeStatus('connected');
    } catch (err) {
      console.error('Unexpected error loading availabilities:', err);
      setSaveError('Unexpected error loading availability data');
    }
  }

  async function saveAvailability() {
    if (!instructorId || selectedDays.length === 0) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    const timerange = `${timeRange.start}-${timeRange.end}`;
    const slotsToSave = selectedDays.map(day => ({
      instructor_id: instructorId,
      day_of_week: day,
      timerange,
      status: 'ACTIVE' as AvailabilityStatus
    }));

    try {
      const { error } = await supabase.from('availability').insert(slotsToSave);
      
      if (error) {
        setSaveError(error.message);
      } else {
        setSaveSuccess(true);
        setShowAddForm(false);
        resetForm();
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Unexpected error saving availability:', err);
      setSaveError('Unexpected error saving availability');
    } finally {
      setIsSaving(false);
    }
  }

  async function updateAvailability(slotId: string, updates: Partial<AvailabilitySlot>) {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const { error } = await supabase
        .from('availability')
        .update(updates)
        .eq('id', slotId);
      
      if (error) {
        setSaveError(error.message);
      } else {
        setSaveSuccess(true);
        setShowAddForm(false);
        setEditingSlot(null);
        resetForm();
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Unexpected error updating availability:', err);
      setSaveError('Unexpected error updating availability');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAvailability(id: string) {
    try {
      // Optimistic update - remove from UI immediately
      setAvailabilities(prev => prev.filter(slot => slot.id !== id))
      
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting availability:', error)
        setSaveError(error.message)
        // Revert optimistic update on error
        loadAvailabilities()
      } else {
        console.log('Availability slot deleted successfully')
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (err) {
      console.error('Unexpected error deleting availability:', err)
      setSaveError('Unexpected error deleting availability')
      // Revert optimistic update on error
      loadAvailabilities()
    }
  }

  function resetForm() {
    setSelectedDays([]);
    setTimeRange({ start: '09:00', end: '17:00' });
  }

  function editSlot(slot: AvailabilitySlot) {
    setEditingSlot(slot);
    const [start, end] = slot.timerange.split('-');
    setTimeRange({ start, end });
    setSelectedDays([slot.day_of_week]);
    setShowAddForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingSlot) {
      const timerange = `${timeRange.start}-${timeRange.end}`;
      updateAvailability(editingSlot.id, { timerange });
    } else {
      saveAvailability();
    }
  }

  function handleDayToggle(day: number) {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  }

  function groupAvailabilitiesByDay() {
    const grouped: { [key: number]: AvailabilitySlot[] } = {};
    DAYS_OF_WEEK.forEach(day => {
      grouped[day.value] = availabilities.filter(slot => slot.day_of_week === day.value);
    });
    return grouped;
  }

  function getSortedAvailabilities() {
    return availabilities
      .filter(slot => slot.start_date) // Only include slots with start_date
      .sort((a, b) => {
        // Sort by start_date first
        const dateA = new Date(a.start_date!);
        const dateB = new Date(b.start_date!);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If same date, sort by day of week
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }
        
        // If same day, sort by time
        const timeA = a.timerange.split('-')[0];
        const timeB = b.timerange.split('-')[0];
        return timeA.localeCompare(timeB);
      });
  }

  function getDayName(dayOfWeek: number) {
    return DAYS_OF_WEEK.find(day => day.value === dayOfWeek)?.label || 'Unknown';
  }

  function formatDateRange(startDate: string | null, endDate: string | null) {
    if (!startDate && !endDate) return null;
    
    function formatDate(dateString: string) {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    const start = startDate ? formatDate(startDate) : 'Always';
    const end = endDate ? formatDate(endDate) : 'Ongoing';
    
    if (startDate && endDate) {
      return `${start} - ${end}`;
    } else if (startDate) {
      return `From ${start}`;
    } else if (endDate) {
      return `Until ${end}`;
    }
    
    return null;
  }

  const sortedAvailabilities = getSortedAvailabilities();

  return (
    <div className={styles.availabilityContainer}>
      <div className={styles.availabilityHeader}>
        <h2 className={styles.availabilityTitle}>Weekly Availability</h2>
        <div className={styles.headerActions}>
          <div className={styles.realtimeStatus}>
            <span className={`${styles.statusIndicator} ${styles[realtimeStatus]}`}></span>
            <span className={styles.statusText}>
              {realtimeStatus === 'connected' ? 'Live' : 
               realtimeStatus === 'disconnected' ? 'Connecting...' : 'Connection Error'}
            </span>
          </div>
          <button
            onClick={() => setShowTimeOffModal(true)}
            className={styles.timeOffButton}
          >
            Create Time Off
          </button>
          <button
            onClick={() => {
              setEditingSlot(null);
              resetForm();
              setShowAddForm(true);
            }}
            className={styles.addAvailabilityButton}
          >
            Add Time Slots
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.formOverlay}>
          <div className={styles.form}>
            <h3>{editingSlot ? 'Edit Time Slot' : 'Add Time Slots'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Select Days</label>
                <div className={styles.daysGrid}>
                  {DAYS_OF_WEEK.map(day => (
                    <label key={day.value} className={styles.dayCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.timeGroup}>
                <div className={styles.formGroup}>
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={timeRange.start}
                    onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>End Time</label>
                  <input
                    type="time"
                    value={timeRange.end}
                    onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingSlot(null);
                    resetForm();
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || selectedDays.length === 0}
                  className={styles.saveButton}
                >
                  {isSaving ? 'Saving...' : (editingSlot ? 'Update Slot' : 'Add Slots')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.weeklySchedule}>
        {DAYS_OF_WEEK.map(day => {
          const daySlots = sortedAvailabilities.filter(slot => slot.day_of_week === day.value);
          return (
            <div key={day.value} className={styles.dayColumn}>
              <div className={styles.dayTitle}>{day.label}</div>
              <div className={styles.timeSlots}>
                {daySlots.length > 0 ? (
                  daySlots.map(slot => (
                    <div key={slot.id} className={styles.timeSlot}>
                      <div className={styles.timeSlotInfo}>
                        <span className={styles.timeRange}>{slot.timerange}</span>
                        <span className={`${styles.status} ${styles[slot.status.toLowerCase()]}`}>
                          {slot.status}
                        </span>
                        {formatDateRange(slot.start_date, slot.end_date) && (
                          <span className={styles.dateRange}>
                            {formatDateRange(slot.start_date, slot.end_date)}
                          </span>
                        )}
                      </div>
                      <div className={styles.timeSlotActions}>
                        <button
                          onClick={() => editSlot(slot)}
                          className={styles.editSlotButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAvailability(slot.id)}
                          className={styles.deleteSlotButton}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptySlot}>
                    No availability set
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {saveSuccess && (
        <div className={styles.floatingSuccessMessage}>
          Availability saved successfully!
        </div>
      )}
      
      {saveError && (
        <div className={styles.floatingErrorMessage}>
          {saveError}
        </div>
      )}

      <TimeOffModal
        isOpen={showTimeOffModal}
        onClose={() => setShowTimeOffModal(false)}
        onComplete={loadAvailabilities}
        instructorId={instructorId || ''}
      />
    </div>
  );
}

export default Availability; 