'use client'

import React, { useState, useEffect } from 'react'

interface Tag {
  id: string
  name: string
  color: string
}

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  onTagFilter?: (tagIds: string[]) => void
  availableTags?: string[]
}

export default function SearchBar({ value, onChange, placeholder, onTagFilter, availableTags }: SearchBarProps) {
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  
  useEffect(() => {
    if (showTagFilter) {
      // Load available tags
      async function fetchTags() {
        try {
          const response = await fetch('/api/tags')
          if (response.ok) {
            const data = await response.json()
            setAllTags(data)
          }
        } catch (error) {
          console.error('Error fetching tags:', error)
        }
      }
      
      fetchTags()
    }
  }, [showTagFilter])
  
  function toggleTagFilter() {
    setShowTagFilter(!showTagFilter)
    if (!showTagFilter) {
      // Clear selected tags when opening
      setSelectedTagIds([])
      if (onTagFilter) {
        onTagFilter([])
      }
    }
  }
  
  function toggleTag(tagId: string) {
    const newSelectedTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId]
    
    setSelectedTagIds(newSelectedTags)
    
    if (onTagFilter) {
      onTagFilter(newSelectedTags)
    }
  }
  
  // Filter the tags based on the availableTags prop if it exists
  const filteredTags = availableTags 
    ? allTags.filter(tag => availableTags.includes(tag.id))
    : allTags;
  
  return (
    <div className="search-bar-container">
      <div className="search-input-container">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        {onTagFilter && (
          <button 
            className={`tag-filter-toggle ${showTagFilter ? 'active' : ''}`}
            onClick={toggleTagFilter}
            title="Filter by tags"
          >
            <span className="tag-icon">🏷️</span>
          </button>
        )}
      </div>
      
      {showTagFilter && (
        <div className="tag-filter-dropdown">
          <div className="tag-filter-header">
            <h4>Filter by Tags</h4>
            {selectedTagIds.length > 0 && (
              <button 
                className="clear-tags-btn"
                onClick={() => {
                  setSelectedTagIds([])
                  if (onTagFilter) onTagFilter([])
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div className="tag-filter-list">
            {filteredTags.length === 0 ? (
              <p>No tags available for this table</p>
            ) : (
              filteredTags.map(tag => (
                <div 
                  key={tag.id}
                  className={`filter-tag-item ${selectedTagIds.includes(tag.id) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag.id)}
                  style={{ 
                    backgroundColor: selectedTagIds.includes(tag.id) ? tag.color : 'transparent',
                    color: selectedTagIds.includes(tag.id) ? getContrastColor(tag.color) : 'inherit',
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
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