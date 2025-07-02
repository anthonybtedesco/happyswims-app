'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './Availability.module.css';
import { Database } from '@/lib/types/supabase';

type AvailabilityStatus = Database['public']['Enums']['AvailabilityStatus'];

interface AvailabilitySlot {
  id: string;
  instructor_id: string;
  day_of_week: number;
  timerange: string;
  status: AvailabilityStatus;
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

  const groupedAvailabilities = groupAvailabilitiesByDay();

  return (
    <div className={styles.availabilityContainer}>
      <div className={styles.availabilityHeader}>
        <h2 className={styles.availabilityTitle}>Weekly Availability</h2>
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
        {DAYS_OF_WEEK.map(day => (
          <div key={day.value} className={styles.dayColumn}>
            <h4 className={styles.dayTitle}>{day.label}</h4>
            <div className={styles.timeSlots}>
              {groupedAvailabilities[day.value]?.map(slot => (
                <div key={slot.id} className={styles.timeSlot}>
                  <div className={styles.timeSlotInfo}>
                    <span className={styles.timeRange}>{slot.timerange}</span>
                    <span className={`${styles.status} ${styles[slot.status.toLowerCase()]}`}>
                      {slot.status}
                    </span>
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
              {(!groupedAvailabilities[day.value] || groupedAvailabilities[day.value].length === 0) && (
                <div className={styles.emptySlot}>
                  <span>No availability set</span>
                </div>
              )}
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
    </div>
  );
}

export default Availability; 