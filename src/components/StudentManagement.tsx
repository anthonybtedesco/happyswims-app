'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Student } from '@/lib/types/supabase';

type StudentWithSelection = Student & {
  selected: boolean;
};

interface StudentManagementProps {
  students: Student[];
  selectedStudents: StudentWithSelection[];
  onStudentsChange: (students: StudentWithSelection[]) => void;
}

export default function StudentManagement({
  students,
  selectedStudents,
  onStudentsChange
}: StudentManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    first_name: '', 
    birthdate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize students with selection state
  useEffect(() => {
    console.log('StudentManagement - Initializing students with selection state');
    const initializedStudents = students.map(student => ({
      ...student,
      selected: selectedStudents.some(s => s.id === student.id && s.selected)
    }));
    onStudentsChange(initializedStudents);
  }, [students]); // Only run when students prop changes

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      console.log('StudentManagement - Adding new student:', newStudent.first_name);
      if (!newStudent.first_name) {
        throw new Error('Student name is required');
      }

      // Get current user's client ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to add students');
      }

      // Get client ID for current user
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client profile not found');

      console.log('StudentManagement - Adding student for client:', clientData.id);

      const { data, error: dbError } = await supabase
        .from('student')
        .insert([{
          ...newStudent,
          client_id: clientData.id
        }])
        .select();

      if (dbError) throw dbError;

      if (data?.[0]) {
        console.log('StudentManagement - Successfully added student:', data[0].id);
        const newStudentWithSelection = { ...data[0], selected: true };
        onStudentsChange([...selectedStudents, newStudentWithSelection]);
        setNewStudent({ 
          first_name: '', 
          birthdate: new Date().toISOString().split('T')[0] 
        });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('StudentManagement - Error adding student:', err);
      setError(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  const toggleStudent = (student: StudentWithSelection) => {
    console.log('StudentManagement - Toggling student selection:', student.id);
    const updatedStudents = students.map(s => ({
      ...s,
      selected: s.id === student.id ? !student.selected : selectedStudents.some(selected => selected.id === s.id && selected.selected)
    }));
    onStudentsChange(updatedStudents);
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        {students.map(student => {
          const isSelected = selectedStudents.some(s => s.id === student.id && s.selected);
          return (
            <div
              key={student.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => toggleStudent({ ...student, selected: isSelected })}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleStudent({ ...student, selected: isSelected })}
                style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  marginRight: '1rem',
                  borderRadius: '4px',
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer'
                }}
              />
              <div>
                <div style={{
                  fontWeight: 500,
                  color: '#1f2937'
                }}>
                  {student.first_name}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {new Date(student.birthdate).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            color: '#3b82f6',
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add New Student
        </button>
      ) : (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: '#f9fafb'
        }}>
          <form onSubmit={handleAddStudent}>
            <div style={{
              display: 'grid',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  Student Name
                </label>
                <input
                  type="text"
                  placeholder="Enter student's name"
                  value={newStudent.first_name}
                  onChange={(e) => setNewStudent(prev => ({
                    ...prev,
                    first_name: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#374151'
                }}>
                  Birth Date
                </label>
                <input
                  type="date"
                  value={newStudent.birthdate}
                  onChange={(e) => setNewStudent(prev => ({
                    ...prev,
                    birthdate: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: 'white'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Add Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewStudent({ 
                    first_name: '', 
                    birthdate: new Date().toISOString().split('T')[0] 
                  });
                  setError(null);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 