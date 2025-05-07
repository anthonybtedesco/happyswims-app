'use client'

import React, { useState, useEffect } from 'react'
import './TagComponents.css'
import { supabase } from '@/lib/supabase/client'
import { Tag, TagSelectorProps } from '@/lib/types'

export function TagSelector({ entityId, entityType, currentTags, onDone }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags.map(tag => tag.id))
  const [isLoading, setIsLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#10b981')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  useEffect(function() {
    fetchTags()
  }, [])
  
  async function fetchTags() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('tag')
        .select('*')
        .order('name', { ascending: true })
        
      if (error) throw error
      
      setAllTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function handleSave() {
    try {
      // First, delete existing entity-tag connections
      const { error: deleteError } = await supabase
        .from(`${entityType}_tag`)
        .delete()
        .eq(`${entityType}_id`, entityId)
      
      if (deleteError) throw deleteError
      
      // Insert new connections
      if (selectedTags.length > 0) {
        const tagConnections = selectedTags.map(tagId => ({
          [`${entityType}_id`]: entityId,
          tag_id: tagId
        }))
        
        const { error: insertError } = await supabase
          .from(`${entityType}_tag`)
          .insert(tagConnections)
        
        if (insertError) throw insertError
      }
      
      onDone()
    } catch (error) {
      console.error('Error saving tags:', error)
    }
  }
  
  async function handleCreateTag() {
    if (!newTagName.trim()) return
    
    try {
      // Check if tag name already exists
      const { data: existingTag, error: checkError } = await supabase
        .from('tag')
        .select('*')
        .eq('name', newTagName)
        .single()
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
      
      if (existingTag) {
        alert('A tag with this name already exists')
        return
      }
      
      // Create new tag
      const { data: newTag, error: insertError } = await supabase
        .from('tag')
        .insert({
          name: newTagName,
          color: newTagColor
        })
        .select()
        .single()
      
      if (insertError) throw insertError
      
      if (newTag) {
        setAllTags([...allTags, newTag])
        setSelectedTags([...selectedTags, newTag.id])
        setNewTagName('')
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }
  
  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }
  
  if (isLoading) {
    return <div className="tag-selector-loading">Loading tags...</div>
  }
  
  return (
    <div className="tag-selector-modal-content">
      <h3 className="tag-selector-title">Manage Tags</h3>
      
      <div className="tag-selector-search-create">
        {!showCreateForm ? (
          <button 
            className="create-tag-btn"
            onClick={function() { setShowCreateForm(true) }}
          >
            Create New Tag
          </button>
        ) : (
          <div className="create-tag-form">
            <input
              type="text"
              placeholder="Tag name"
              value={newTagName}
              onChange={function(e) { setNewTagName(e.target.value) }}
              autoFocus
            />
            <div className="color-picker">
              <label>Color:</label>
              <input
                type="color"
                value={newTagColor}
                onChange={function(e) { setNewTagColor(e.target.value) }}
              />
            </div>
            <div className="create-tag-actions">
              <button onClick={function() { setShowCreateForm(false) }} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleCreateTag} className="create-btn">
                Create
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="tags-container">
        {allTags.length > 0 ? (
          <div className="tag-grid">
            {allTags.map(function(tag) {
              const isSelected = selectedTags.includes(tag.id)
              return (
                <div 
                  key={tag.id} 
                  className={`tag-item ${isSelected ? 'selected' : ''}`}
                  onClick={function() { toggleTag(tag.id) }}
                  style={{ 
                    backgroundColor: isSelected ? tag.color : 'transparent',
                    color: isSelected ? getContrastColor(tag.color) : 'inherit',
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                  {isSelected && (
                    <span className="checkmark">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="no-tags-message">No tags available. Create one!</p>
        )}
      </div>
      
      <div className="tag-selector-actions">
        <button onClick={onDone} className="cancel-btn">
          Cancel
        </button>
        <button onClick={handleSave} className="save-btn">
          Save
        </button>
      </div>
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