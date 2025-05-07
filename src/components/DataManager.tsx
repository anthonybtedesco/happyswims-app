'use client'

import React, { useState, useEffect } from 'react'
import { Address, Instructor, Client, Availability } from '@/lib/types/supabase'
import { EventSourceInput } from '@fullcalendar/core'
import { supabase } from '@/lib/supabase/client'

interface DataManagerProps {
  children: (props: {
    selectedTable: string
    searchQuery: string
    filteredData: any[]
    filteredAddresses: Address[]
    selectedRows: any[]
    calendarEvents: any[]
    handleSearch: (query: string) => void
    handleTableChange: (table: string) => void
    handleRowSelect: (row: any) => void
    deleteSelectedRows: () => Promise<void>
    userEmails: Record<string, string>
    handleTagFilter: (tagIds: string[]) => void
    availableTags: string[]
  }) => React.ReactNode
  clients: Client[]
  instructors: Instructor[]
  addresses: Address[]
  bookings: any[]
  availabilities: Availability[]
  fetchData: () => Promise<void>
}

export default function DataManager({
  children,
  clients,
  instructors,
  addresses,
  bookings,
  availabilities,
  fetchData
}: DataManagerProps) {
  const [selectedTable, setSelectedTable] = useState('clients')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState<any[]>([])
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  
  useEffect(() => {
    // Fetch user emails for display
    async function fetchUserEmails() {
      try {
        // Use the admin API endpoint to fetch all user emails
        const response = await fetch('/api/auth/list-all-users')
        if (response.ok) {
          const { users } = await response.json()
          setUserEmails(users)
        } else {
          console.error('Error fetching user emails from API')
        }
      } catch (error) {
        console.error('Error fetching user emails:', error)
      }
    }
    
    fetchUserEmails()
  }, [])
  
  // Reset selections when changing tables
  useEffect(() => {
    setSelectedRows([])
    setSearchQuery('')
    setSelectedTagIds([])
    fetchTagsForTable(selectedTable)
  }, [selectedTable])
  
  // Fetch tags specific to the selected table
  async function fetchTagsForTable(table: string) {
    try {
      // Determine the junction table name based on selected table
      const junctionTable = 
        table === 'clients' ? 'client_tag' : 
        table === 'instructors' ? 'instructor_tag' :
        table === 'bookings' ? 'booking_tag' :
        table === 'addresses' ? 'address_tag' :
        table === 'availabilities' ? 'availability_tag' : '';
      
      if (junctionTable) {
        // Get distinct tag_ids from the junction table
        const { data, error } = await supabase
          .from(junctionTable)
          .select('tag_id')
          .order('tag_id');
        
        if (!error && data) {
          // Extract unique tag_ids
          const uniqueTagIds = [...new Set(data.map(item => item.tag_id))];
          setAvailableTags(uniqueTagIds);
        } else {
          console.error(`Error fetching tags for ${table}:`, error);
          setAvailableTags([]);
        }
      } else {
        setAvailableTags([]);
      }
    } catch (error) {
      console.error(`Error fetching tags for ${table}:`, error);
      setAvailableTags([]);
    }
  }
  
  // Handle table change
  function handleTableChange(table: string) {
    // Fetch tags for the new table before changing state
    fetchTagsForTable(table)
    setSelectedTable(table)
    fetchData() // Refresh data including tags when tab changes
  }
  
  // Handle search query change
  function handleSearch(query: string) {
    setSearchQuery(query)
  }
  
  // Handle tag filtering
  function handleTagFilter(tagIds: string[]) {
    // Only allow filtering by tags that are available for current table
    const validTagIds = tagIds.filter(id => availableTags.includes(id))
    setSelectedTagIds(validTagIds)
  }
  
  // Handle row selection
  function handleRowSelect(row: any) {
    const isSelected = selectedRows.some(selectedRow => selectedRow.id === row.id)
    
    if (isSelected) {
      setSelectedRows(selectedRows.filter(selectedRow => selectedRow.id !== row.id))
    } else {
      setSelectedRows([...selectedRows, row])
    }
  }
  
  // Delete selected rows
  async function deleteSelectedRows() {
    try {
      const tableName = 
        selectedTable === 'clients' ? 'client' : 
        selectedTable === 'instructors' ? 'instructor' :
        selectedTable === 'bookings' ? 'booking' :
        selectedTable === 'addresses' ? 'address' : 'availability';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', selectedRows.map(row => row.id));
      
      if (!error) {
        setSelectedRows([])
        await fetchData()
        // Refresh available tags after deletion
        fetchTagsForTable(selectedTable)
      } else {
        console.error('Error deleting rows:', error)
      }
    } catch (error) {
      console.error('Error deleting rows:', error)
    }
  }
  
  // Helper to get tags for an item based on table type
  function getTags(item: any, tableType: string) {
    switch (tableType) {
      case 'clients':
        return item.client_tag || []
      case 'instructors':
        return item.instructor_tag || []
      case 'bookings':
        return item.booking_tag || []
      case 'addresses':
        return item.address_tag || []
      case 'availabilities':
        return item.availability_tag || []
      default:
        return []
    }
  }
  
  // Filter data based on search query and selected tags
  const filteredData = (() => {
    let data: any[] = []
    
    switch (selectedTable) {
      case 'clients':
        data = clients
        break
      case 'instructors':
        data = instructors
        break
      case 'bookings':
        data = bookings
        break
      case 'addresses':
        data = addresses
        break
      case 'availabilities':
        data = availabilities
        break
      default:
        data = []
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(item => {
        // Check fields based on table type
        switch (selectedTable) {
          case 'clients':
            return (
              (item.first_name && item.first_name.toLowerCase().includes(query)) ||
              (item.last_name && item.last_name.toLowerCase().includes(query)) ||
              (userEmails[item.user_id] && userEmails[item.user_id].toLowerCase().includes(query))
            )
          case 'addresses':
            return (
              (item.address_line && item.address_line.toLowerCase().includes(query)) ||
              (item.city && item.city.toLowerCase().includes(query)) ||
              (item.state && item.state.toLowerCase().includes(query)) ||
              (item.zip && item.zip.toLowerCase().includes(query))
            )
          case 'bookings':
            const client = clients.find(c => c.id === item.client_id)
            const instructor = instructors.find(i => i.id === item.instructor_id)
            const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : ''
            const instructorName = instructor ? `${instructor.first_name} ${instructor.last_name}`.toLowerCase() : ''
            
            return (
              clientName.includes(query) ||
              instructorName.includes(query) ||
              (item.status && item.status.toLowerCase().includes(query))
            )
          case 'availabilities':
            const availInstructor = instructors.find(i => i.id === item.instructor_id)
            const availInstructorName = availInstructor ? `${availInstructor.first_name} ${availInstructor.last_name}`.toLowerCase() : ''
            
            return (
              availInstructorName.includes(query) ||
              (item.timerange && item.timerange.toLowerCase().includes(query))
            )
          default:
            return false
        }
      })
    }
    
    // Filter by selected tags
    if (selectedTagIds.length > 0) {
      data = data.filter(item => {
        const itemTags = getTags(item, selectedTable)
        
        // Check if item has any of the selected tags
        return selectedTagIds.some(tagId => 
          itemTags.some((itemTag: any) => itemTag.tag_id === tagId)
        )
      })
    }
    
    return data
  })()
  
  // Filter addresses based on search
  const filteredAddresses = (() => {
    if (selectedTable === 'addresses') {
      return filteredData
    }
    
    // Otherwise, return all addresses
    return addresses
  })()
  
  // Generate calendar events from bookings
  const calendarEvents = bookings.map(booking => {
    const client = clients.find(c => c.id === booking.client_id)
    const instructor = instructors.find(i => i.id === booking.instructor_id)
    
    return {
      id: booking.id,
      title: `${client ? `${client.first_name} ${client.last_name}` : 'Unknown'} with ${instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown'}`,
      start: booking.start_time,
      end: booking.end_time,
      status: booking.status
    }
  })
  
  return children({
    selectedTable,
    searchQuery,
    filteredData,
    filteredAddresses,
    selectedRows,
    calendarEvents,
    handleSearch,
    handleTableChange,
    handleRowSelect,
    deleteSelectedRows,
    userEmails,
    handleTagFilter,
    availableTags
  })
} 