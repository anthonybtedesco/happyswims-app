'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useData } from '@/lib/context/DataContext'
import MapComponent from '@/lib/mapbox/MapComponent'
import './DataTab.css'

// Import components for the data view
import DataTable from '@/components/DataTable'
import SearchBar from '@/components/SearchBar'
import CollapsiblePanel from '@/components/CollapsiblePanel'
import CalendarView from '@/components/CalendarView'
import TabNavigation from '@/components/TabNavigation'
import DeleteButton from '@/components/buttons/DeleteButton'
import AddButton from '@/components/buttons/AddButton'
import TagDisplay from '@/components/TagDisplay'

// Define the Tag interface expected by TagDisplay
interface Tag {
  tag: {
    id: string
    name: string
    color: string
  }
  tag_id: string
}

export default function DataTab() {
  const { 
    clients, 
    instructors, 
    addresses, 
    bookings, 
    availabilities,
    students,
    loading 
  } = useData();

  const [selectedTable, setSelectedTable] = useState('clients')
  const [editingCell, setEditingCell] = useState<{rowId: string, column: string, value: string} | null>(null)
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Define the available tabs
  const tabs = [
    { id: 'clients', label: 'Clients' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'students', label: 'Students' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'availabilities', label: 'Availabilities' }
  ]

  // Helper function to transform client tags to match the expected format
  function transformClientTags(tags: Array<{tag: {id: string, name: string, color: string}, tagId: string}> | undefined): Tag[] {
    if (!tags || tags.length === 0) return []
    return tags.map(item => ({
      tag: item.tag,
      tag_id: item.tagId
    }))
  }

  // Helper function to transform instructor/address/booking tags to match the expected format
  function transformOtherTags(tags: Array<{tag: {id: string, name: string, color: string}, tag_id: string}> | undefined): Tag[] {
    if (!tags || tags.length === 0) return []
    return tags.map(item => ({
      tag: item.tag,
      tag_id: item.tag_id
    }))
  }

  useEffect(() => {
    const fetchUserEmails = async () => {
      const userIds = [...clients, ...instructors]
        .map(u => u.user_id)
        .filter(Boolean)
      
      if (userIds.length === 0) return
      
      try {
        const response = await fetch('/api/auth/list-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user emails')
        }

        setUserEmails(data.users)
      } catch (error) {
        console.error('Error fetching user emails:', error)
      }
    }

    if (clients.length > 0 || instructors.length > 0) {
      fetchUserEmails()
    }
  }, [clients, instructors])

  const handleCellChange = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string, column: string, table: string) => {
    const value = e.target.value
    setEditingCell({rowId, column, value})
  }

  const handleCellBlur = async () => {
    if (!editingCell) return

    try {
      const { rowId, column, value } = editingCell
      const { error } = await supabase
        .from(selectedTable === 'clients' ? 'client' : 
              selectedTable === 'instructors' ? 'instructor' :
              selectedTable === 'students' ? 'student' :
              selectedTable === 'bookings' ? 'booking' : 'address')
        .update({ [column]: value })
        .eq('id', rowId)

      if (error) throw error
    } catch (err: any) {
      console.error('Error updating cell:', err)
    }

    setEditingCell(null)
  }

  const handleRowSelect = (rowId: string) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId)
      }
      return [...prev, rowId]
    })
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId)
    setSelectedRows([]) // Clear selected rows when changing tables
  }

  const deleteSelectedRows = async () => {
    if (selectedRows.length === 0) return

    const tableName = selectedTable === 'clients' ? 'client' : 
                      selectedTable === 'instructors' ? 'instructor' :
                      selectedTable === 'students' ? 'student' :
                      selectedTable === 'bookings' ? 'booking' :
                      selectedTable === 'addresses' ? 'address' : 'availability'

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', selectedRows)

      if (error) throw error

      setSelectedRows([])
    } catch (err: any) {
      console.error(`Error deleting ${tableName}:`, err)
    }
  }

  const filterData = (data: any[]) => {
    if (!searchQuery) return data

    const query = searchQuery.toLowerCase()
    return data.filter(item => {
      // Convert all values to strings and check if any contain the search query
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false
        
        // Handle nested objects (like finding client/instructor names in bookings)
        if (typeof value === 'object') {
          return Object.values(value).some(v => 
            String(v).toLowerCase().includes(query)
          )
        }
        
        return String(value).toLowerCase().includes(query)
      })
    })
  }

  // Get filtered data based on search query
  const getFilteredData = () => {
    switch (selectedTable) {
      case 'clients':
        return filterData(clients)
      case 'instructors':
        return filterData(instructors)
      case 'students':
        return filterData(students)
      case 'bookings':
        return filterData(bookings)
      case 'addresses':
        return filterData(addresses)
      case 'availabilities':
        return filterData(availabilities)
      default:
        return []
    }
  }

  // Get filtered addresses for the map
  const getFilteredAddresses = () => {
    if (selectedTable === 'addresses') {
      return filterData(addresses)
    }
    return addresses
  }

  // Get calendar events based on filtered data
  const getCalendarEvents = () => {
    const filteredBookings = selectedTable === 'bookings' ? filterData(bookings) : bookings
    const filteredAvailabilities = selectedTable === 'availabilities' ? filterData(availabilities) : availabilities

    const events = [
      ...filteredBookings.map(booking => ({
        id: booking.id,
        title: `Booking: ${booking.client_id}`,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: '#3b82f6'
      })),
      ...filteredAvailabilities.map(availability => ({
        id: `avail-${availability.id}`,
        title: `Available: ${availability.instructor_id}`,
        start: availability.start_date,
        end: availability.end_date,
        backgroundColor: availability.color || '#10b981'
      }))
    ]

    return events
  }

  // Define columns for each table type
  const getColumns = () => {
    switch (selectedTable) {
      case 'clients':
        return [
          { key: 'id', header: 'ID' },
          { key: 'first_name', header: 'First Name', editable: true },
          { key: 'last_name', header: 'Last Name', editable: true },
          { 
            key: 'user_id', 
            header: 'Email',
            render: (row: any) => userEmails[row.user_id] || 'No email'
          },
          { 
            key: 'home_address_id', 
            header: 'Home Address',
            render: (row: any) => {
              const addr = addresses.find((a: any) => a.id === row.home_address_id);
              return addr ? addr.address_line : 'No address';
            }
          },
          {
            key: 'client_tag',
            header: 'Tags',
            render: (row: any) => { 
              return <TagDisplay 
                entityId={row.id} 
                entityType="client" 
                tags={transformClientTags(row.client_tag)} 
                onTagChange={() => {}} 
              />;
            }
          }
        ]
      case 'instructors':
        return [
          { key: 'id', header: 'ID' },
          { key: 'first_name', header: 'First Name', editable: true },
          { key: 'last_name', header: 'Last Name', editable: true },
          { 
            key: 'user_id', 
            header: 'Email',
            render: (row: any) => userEmails[row.user_id] || 'No email'
          },
          { 
            key: 'home_address_id', 
            header: 'Home Address',
            render: (row: any) => {
              const addr = addresses.find((a: any) => a.id === row.home_address_id);
              return addr ? addr.address_line : 'No address'; 
            }
          },
          {
            key: 'instructor_tag',
            header: 'Tags',
            render: (row: any) => { 
              return <TagDisplay 
                entityId={row.id} 
                entityType="instructor" 
                tags={transformOtherTags(row.instructor_tag)} 
                onTagChange={() => {}} 
              />;
            }
          }
        ]
      case 'students':
        return [
          { key: 'id', header: 'ID' },
          { key: 'first_name', header: 'First Name', editable: true },
          { 
            key: 'client_id', 
            header: 'Client',
            render: (row: any) => {
              const client = clients.find((c: any) => c.id === row.client_id);
              return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
            }
          },
          { 
            key: 'birthdate', 
            header: 'Birth Date',
            render: (row: any) => new Date(row.birthdate).toLocaleDateString(),
            editable: true
          },
          {
            key: 'student_tag',
            header: 'Tags',
            render: (row: any) => {
              return <TagDisplay 
                entityId={row.id} 
                entityType="student" 
                tags={transformOtherTags(row.student_tag)} 
                onTagChange={() => {}} 
              />;
            }
          }
        ]
      case 'bookings':
        return [
          { key: 'id', header: 'ID' },
          { 
            key: 'client_id', 
            header: 'Client',
            render: (row: any) => {
              const client = clients.find((c: any) => c.id === row.client_id);
              return client ? `${client.first_name} ${client.last_name}` : 'Unknown';
            }
          },
          { 
            key: 'instructor_id', 
            header: 'Instructor',
            render: (row: any) => {
              const instructor = instructors.find((i: any) => i.id === row.instructor_id);
              return instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown';
            }
          },
          { 
            key: 'start_time', 
            header: 'Start Time',
            render: (row: any) => new Date(row.start_time).toLocaleString()
          },
          { 
            key: 'end_time', 
            header: 'End Time',
            render: (row: any) => new Date(row.end_time).toLocaleString()
          },
          { key: 'status', header: 'Status' },
          {
            key: 'booking_tag',
            header: 'Tags',
            render: (row: any) => {
              return <TagDisplay 
                entityId={row.id} 
                entityType="booking" 
                tags={transformOtherTags(row.booking_tag)} 
                onTagChange={() => {}} 
              />;
            }
          }
        ]
      case 'addresses':
        return [
          { key: 'id', header: 'ID' },
          { key: 'address_line', header: 'Address', editable: true },
          { key: 'city', header: 'City', editable: true },
          { key: 'state', header: 'State', editable: true },
          { key: 'zip', header: 'ZIP', editable: true },
          { 
            key: 'coordinates', 
            header: 'Coordinates',
            render: (row: any) => `(${row.latitude}, ${row.longitude})`
          },
          {
            key: 'address_tag',
            header: 'Tags',
            render: (row: any) => {
              return <TagDisplay 
                entityId={row.id} 
                entityType="address" 
                tags={transformOtherTags(row.address_tag)} 
                onTagChange={() => {}} 
              />;
            }
          }
        ]
      case 'availabilities':
        return [
          { key: 'id', header: 'ID' },
          { 
            key: 'instructor_id', 
            header: 'Instructor',
            render: (row: any) => {
              const instructor = instructors.find((i: any) => i.id === row.instructor_id);
              return instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown';
            }
          },
          { 
            key: 'start_date', 
            header: 'Start Date',
            render: (row: any) => new Date(row.start_date).toLocaleDateString(),
            editable: true
          },
          { 
            key: 'end_date', 
            header: 'End Date',
            render: (row: any) => new Date(row.end_date).toLocaleDateString(),
            editable: true
          },
          { key: 'timerange', header: 'Time Range', editable: true },
          { 
            key: 'color', 
            header: 'Color',
            render: (row: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    backgroundColor: row.color || '#10b981',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }} 
                />
                {row.color || '#10b981'}
              </div>
            ),
            editable: true
          }
        ]
      default:
        return []
    }
  }

  // Get available tags for filtering
  const getAvailableTags = () => {
    return []
  }

  // Handle tag filter selection
  const handleTagFilter = (tagIds: string[]) => {
    // Implement tag filtering logic here
    console.log('Filter by tags:', tagIds)
  }

  // Show loading state
  if (loading.clients || loading.instructors || loading.addresses || loading.bookings || loading.availabilities || loading.students) {
    return <div>Loading data...</div>;
  }

  const filteredData = getFilteredData()
  const filteredAddresses = getFilteredAddresses()
  const calendarEvents = getCalendarEvents()

  return (
    <div className="data-tab">
      <div>
        <TabNavigation 
          tabs={tabs} 
          activeTab={selectedTable} 
          onTabChange={handleTableChange} 
        />
        
        <div className="tab-content">
          <div className="layout-container">
            <div className="data-section">
              <div className="search-and-actions">
                <div className="search-actions-left">
                  <SearchBar 
                    value={searchQuery} 
                    onChange={handleSearch}
                    placeholder={`Search ${selectedTable}...`}
                    onTagFilter={handleTagFilter}
                    availableTags={[]}
                  />
                  
                  {selectedRows.length > 0 && (
                    <DeleteButton 
                      selectedCount={selectedRows.length} 
                      onDelete={deleteSelectedRows}
                      selectedRows={selectedRows}
                      tableName={selectedTable === 'clients' ? 'client' : 
                                selectedTable === 'instructors' ? 'instructor' :
                                selectedTable === 'students' ? 'student' :
                                selectedTable === 'bookings' ? 'booking' :
                                selectedTable === 'addresses' ? 'address' : 'availability'}
                    />
                  )}
                </div>

                <div className="search-actions-right">
                  <AddButton 
                    table={selectedTable === 'clients' ? 'client' : 
                          selectedTable === 'instructors' ? 'instructor' :
                          selectedTable === 'students' ? 'student' :
                          selectedTable === 'bookings' ? 'booking' :
                          selectedTable === 'addresses' ? 'address' : 'availability'}
                    fetchData={async () => Promise.resolve()}
                    options={{
                      clients,
                      instructors,
                      addresses
                    }}
                  />
                </div>
              </div>
              
              <DataTable 
                data={filteredData}
                columns={getColumns()}
                tableName={selectedTable === 'clients' ? 'client' : 
                          selectedTable === 'instructors' ? 'instructor' :
                          selectedTable === 'students' ? 'student' :
                          selectedTable === 'bookings' ? 'booking' :
                          selectedTable === 'addresses' ? 'address' : 'availability'}
                onRowSelect={handleRowSelect}
                selectedRows={selectedRows}
                fetchData={async () => Promise.resolve()}
              />
            </div>
            
            <div className="views-section">
              <CollapsiblePanel title="Map View">
                <MapComponent
                  addresses={filteredAddresses}
                  height="300px"
                  defaultMarkerColor="#4BB543"
                />
              </CollapsiblePanel>
              
              <CollapsiblePanel title="Calendar View">
                <CalendarView events={calendarEvents} />
              </CollapsiblePanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 