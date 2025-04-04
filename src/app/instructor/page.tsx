'use client'

import { useState } from "react";
import Availability from "@/components/Availability";
import InstructorForm from "@/components/forms/InstructorForm";

export default function InstructorPage() {
  const [activeTab, setActiveTab] = useState('availability');

  return (
    <main style={{ padding: '1.5rem' }}>
      <h1 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        marginBottom: '1.5rem', 
        color: 'black' 
      }}>
        Instructor Dashboard
      </h1>
      
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #e5e7eb', 
        marginBottom: '1.5rem' 
      }}>
        <button 
          onClick={() => setActiveTab('availability')}
          style={{
            padding: '0.75rem 1rem',
            marginRight: '1rem',
            borderBottom: activeTab === 'availability' ? '2px solid #3b82f6' : 'none',
            fontWeight: activeTab === 'availability' ? 'bold' : 'normal',
            color: activeTab === 'availability' ? '#3b82f6' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Availability
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1rem',
            borderBottom: activeTab === 'profile' ? '2px solid #3b82f6' : 'none',
            fontWeight: activeTab === 'profile' ? 'bold' : 'normal',
            color: activeTab === 'profile' ? '#3b82f6' : '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Profile
        </button>
      </div>
      
      {activeTab === 'availability' ? <Availability /> : <InstructorForm />}
    </main>
  )
}