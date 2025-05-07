'use client'

import React, { useState } from 'react'
import { TagSelector } from './TagSelector'
import './TagComponents.css'
import { TagDisplayProps } from '@/lib/types'

export default function TagDisplay({ entityId, entityType, tags, onTagChange }: TagDisplayProps) {
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false)
  
  function openTagSelector() {
    setIsTagSelectorOpen(true)
  }
  
  function closeTagSelector() {
    setIsTagSelectorOpen(false)
    onTagChange()
  }
  
  if (isTagSelectorOpen) {
    return (
      <div className="tag-selector-modal">
        <TagSelector 
          entityId={entityId} 
          entityType={entityType} 
          currentTags={tags.map(t => t.tag)} 
          onDone={closeTagSelector} 
        />
      </div>
    )
  }
  
  return (
    <div className="tag-display">
      <div className="tag-list">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span 
              key={`${tag.tag_id}-${index}`} 
              className="tag-pill"
              style={{ 
                backgroundColor: tag.tag.color || '#e2e8f0',
                color: getContrastColor(tag.tag.color || '#e2e8f0')
              }}
            >
              {tag.tag.name}
            </span>
          ))
        ) : (
          <span className="no-tags">No tags</span>
        )}
      </div>
      <button 
        className="add-tag-btn"
        onClick={openTagSelector}
        title="Add tags"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M12 5v14M5 12h14"></path>
        </svg>
      </button>
    </div>
  )
}

function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return black or white depending on brightness
  return luminance > 0.5 ? '#000000' : '#ffffff'
} 