"use client";

import React, { useState, useEffect } from 'react';
import { useData } from '@/lib/context/DataContext';
import { calculateRealAvailability, RealAvailability } from '@/utils/availability';
import CreateBookingCalendar from './CreateBookingCalendar';
import PoolAddressSelect from './PoolAddressSelect';
import StudentManagement from './StudentManagement';
import TimeSelect from './TimeSelect';
import { Student } from '@/lib/types/supabase';
import { supabase } from '@/lib/supabase/client';

type StudentWithSelection = Student & {
  selected: boolean;
};

interface BookingFormState {
  // Step 1: Pool Selection
  poolAddressId: string;
  
  // Step 2: Student Management
  students: StudentWithSelection[];
  
  // Step 3: Time Selection
  startTime: string;
  duration: number;
  
  // Step 4: Week & Instructor Selection
  selectedWeek: Date | null;
  instructorId: string;
  clientId: string;
}

const initialFormState: BookingFormState = {
  poolAddressId: '',
  students: [],
  startTime: '',
  duration: 0,
  selectedWeek: null,
  instructorId: '',
  clientId: ''
};

interface BookingPortalProps {
  clientId?: string;
}

export default function BookingPortal({ clientId }: BookingPortalProps) {
  const [formState, setFormState] = useState<BookingFormState>({
    ...initialFormState,
    clientId: clientId || ''
  });
  
  // Data context hooks
  const { instructors, clients, addresses, availabilities, bookings, loading } = useData();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  
  const [realAvailability, setRealAvailability] = useState<RealAvailability>({});

  // Load students data
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from('student')
          .select('*');
        
        if (error) throw error;
        setStudents(data || []);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoadingStudents(false);
      }
    };
    
    fetchStudents();
  }, []);

  // Calculate real availability when dependencies change
  useEffect(() => {
    if (!formState.selectedWeek || instructors.length === 0) {
      return;
    }

    try {
      // Calculate start and end of the selected week
      const weekStart = new Date(formState.selectedWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Calculate real availability for all instructors
      const availability = calculateRealAvailability(
        instructors.map(i => i.id),
        availabilities,
        bookings,
        weekStart,
        weekEnd
      );

      setRealAvailability(availability);
    } catch (err) {
      console.error('BookingPortal - Error calculating availability:', err);
    }
  }, [
    formState.selectedWeek,
    instructors,
    availabilities,
    bookings
  ]);

  // Handle week selection
  const handleWeekSelect = (weekStart: Date) => {
    try {
      // Validate date
      if (!(weekStart instanceof Date) || isNaN(weekStart.getTime())) {
        throw new Error('Invalid week selection');
      }

      // Ensure week starts on Monday
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(weekStart.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      setFormState(prev => ({
        ...prev,
        selectedWeek: monday,
        // Clear instructor selection when week changes
        instructorId: ''
      }));
    } catch (err) {
      console.error('BookingPortal - Error handling week selection:', err);
    }
  };

  // Show loading state if any data is still loading
  if (loading.instructors || loading.clients || loading.addresses || 
      loading.availabilities || loading.bookings || loadingStudents) {
    return <div>Loading data...</div>;
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'grid',
        gap: '2rem'
      }}>
        {/* Step 1: Pool Selection */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          gridColumn: 'span 2'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Select Pool Location
          </h2>
          <PoolAddressSelect
            addresses={addresses}
            selectedAddressId={formState.poolAddressId}
            onAddressSelect={(addressId) => {
              setFormState(prev => ({
                ...prev,
                poolAddressId: addressId
              }));
            }}
          />
        </section>

        {/* Step 2: Student Management */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Select Students
          </h2>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem'
          }}>
            <StudentManagement
              students={students}
              selectedStudents={formState.students}
              onStudentsChange={(students) => {
                setFormState(prev => ({
                  ...prev,
                  students,
                  duration: students.filter(s => s.selected).length * 35
                }));
              }}
            />
            {formState.students.filter(s => s.selected).length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                color: '#1f2937',
                fontSize: '0.9rem'
              }}>
                {formState.students.filter(s => s.selected).length} student{formState.students.filter(s => s.selected).length !== 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Time Selection */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Select Start Time
          </h2>
          <TimeSelect
            selectedTime={formState.startTime}
            onTimeSelect={(time) => {
              setFormState(prev => ({
                ...prev,
                startTime: time
              }));
            }}
            duration={formState.duration}
            disabled={formState.duration === 0}
          />
          {formState.duration > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              color: '#1f2937',
              fontSize: '0.9rem'
            }}>
              Lesson Duration: {formState.duration} minutes
            </div>
          )}
        </section>

        {/* Step 4: Week & Instructor Selection */}
        <section style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          gridColumn: 'span 2'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Select Week & Instructor
          </h2>
          <div style={{
            gap: '2rem',
          }}>
            {/* Calendar Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '1rem'
              }}>
                <CreateBookingCalendar
                  realAvailabilities={realAvailability}
                  selectedWeek={formState.selectedWeek}
                  onWeekSelect={handleWeekSelect}
                />
              </div>
              {formState.selectedWeek && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '6px',
                  color: '#0369a1',
                  fontSize: '0.9rem'
                }}>
                  Selected Week: {formState.selectedWeek.toLocaleDateString()} - {new Date(formState.selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Instructor List Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#4b5563',
                marginBottom: '0.5rem'
              }}>
                Available Instructors
              </div>
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                {instructors.length > 0 ? (
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {instructors.map(instructor => {
                      const isAvailable = realAvailability[instructor.id]?.some(slot => {
                        if (!formState.selectedWeek) return false;
                        const slotDate = new Date(slot.start);
                        return slotDate >= formState.selectedWeek && 
                               slotDate <= new Date(formState.selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
                      });

                      return (
                        <div
                          key={instructor.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: formState.instructorId === instructor.id ? '#eff6ff' : '#ffffff',
                            opacity: isAvailable ? 1 : 0.5,
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (isAvailable) {
                              setFormState(prev => ({
                                ...prev,
                                instructorId: instructor.id
                              }));
                            }
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: 500,
                              color: '#1f2937'
                            }}>
                              {instructor.first_name} {instructor.last_name}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#6b7280',
                              marginTop: '0.25rem'
                            }}>
                              {isAvailable ? 'Available this week' : 'Not available this week'}
                            </div>
                          </div>
                          {formState.instructorId === instructor.id && (
                            <div style={{
                              color: '#3b82f6'
                            }}>
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No instructors available
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
