'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './Availability.module.css';
import { Database } from '@/lib/types/supabase';
import TimeOffModal from './TimeOffModal';

type AvailabilityStatus = Database['public']['Enums']['AvailabilityStatus'];

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

interface TimeRange {
  start: string;
  end: string;
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

  useEffect(function subscribeRealtime() {
    if (!instructorId) return;
    
    const availabilitySub = supabase
      .channel('availability_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'availability', 
        filter: `instructor_id=eq.${instructorId}` 
      }, payload => {
        loadAvailabilities();
      })
      .subscribe();

    return function cleanup() {
      supabase.removeChannel(availabilitySub);
    };
  }, [instructorId]);

  useEffect(function initialLoad() {
    if (instructorId) {
      loadAvailabilities();
    }
  }, [instructorId]);

  async function loadAvailabilities() {
    if (!instructorId) return;
    
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('day_of_week', { ascending: true })
      .order('timerange', { ascending: true });

    if (!error) {
      console.log('Weekly view - Loaded availabilities:', data);
      setAvailabilities(data || []);
    } else {
      console.error('Error loading availabilities:', error);
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

    const { error } = await supabase.from('availability').insert(slotsToSave);
    setIsSaving(false);
    
    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setShowAddForm(false);
      resetForm();
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  }

  async function updateAvailability(slotId: string, updates: Partial<AvailabilitySlot>) {
    setIsSaving(true);
    setSaveError(null);
    
    const { error } = await supabase
      .from('availability')
      .update(updates)
      .eq('id', slotId);
    
    setIsSaving(false);
    
    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setShowAddForm(false);
      setEditingSlot(null);
      resetForm();
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  }

  async function deleteAvailability(id: string) {
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('id', id);
    
    if (error) {
      setSaveError(error.message);
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
    
    console.log('formatDateRange called with:', { startDate, endDate });
    
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
    
    console.log('formatted dates:', { start, end });
    
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
        {sortedAvailabilities.map(slot => (
          <div key={slot.id} className={styles.timeSlot}>
            <div className={styles.timeSlotInfo}>
              <span className={styles.dayOfWeek}>{getDayName(slot.day_of_week)}</span>
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
        ))}
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