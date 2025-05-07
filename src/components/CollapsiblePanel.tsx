import React, { useState, ReactNode } from 'react'

interface CollapsiblePanelProps {
  title: string
  children: ReactNode
  defaultExpanded?: boolean
}

export default function CollapsiblePanel({ 
  title, 
  children, 
  defaultExpanded = true 
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="view-container">
      <div 
        className="section-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '16px' }}
      >
        <h3>{title}</h3>
        <svg
          className={`collapse-icon ${isExpanded ? 'expanded' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  )
} 