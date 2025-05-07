'use client'

import React from 'react'
import { Address, Instructor, Client, Availability } from '@/lib/types/supabase'
import MapComponent from '@/lib/mapbox/MapComponent'
import './DataTab.css'

// Import the new components
import DataTable from '@/components/DataTable'
import SearchBar from '@/components/SearchBar'
import CollapsiblePanel from '@/components/CollapsiblePanel'
import CalendarView from '@/components/CalendarView'
import DataManager from '@/components/DataManager'
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

interface DataTabProps {
  clients: Client[]
  instructors: Instructor[]
  addresses: Address[]
  bookings: any[]
  availabilities: Availability[]
  fetchData: () => Promise<void>
}

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

export default function DataTab({
  clients,
  instructors,
  addresses,
  bookings,
  availabilities,
  fetchData
}: DataTabProps) {
  // Define the available tabs
  const tabs = [
    { id: 'clients', label: 'Clients' },
    { id: 'instructors', label: 'Instructors' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'addresses', label: 'Addresses' },
    { id: 'availabilities', label: 'Availabilities' }
  ]

  // Define columns for each table type
  function getColumns(tableType: string, userEmails: Record<string, string>) {
    switch (tableType) {
      case 'clients':
        return [
          { key: 'id', header: 'ID' },
          { key: 'first_name', header: 'First Name', editable: true },
          { key: 'last_name', header: 'Last Name', editable: true },
          { 
            key: 'user_id', 
            header: 'Email',
            render: function(row: Client) { return userEmails[row.user_id] || 'No email' }
          },
          { 
            key: 'home_address_id', 
            header: 'Home Address',
            render: function(row: Client) {
              return addresses.find(addr => addr.id === row.home_address_id)?.address_line || 'No address'
            }
          },
          {
            key: 'client_tag',
            header: 'Tags',
            render: function(row: Client) { 
              return <TagDisplay entityId={row.id} entityType="client" tags={transformClientTags(row.client_tag)} onTagChange={fetchData} />
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
            render: function(row: Instructor) { return userEmails[row.user_id] || 'No email' }
          },
          { 
            key: 'home_address_id', 
            header: 'Home Address',
            render: function(row: Instructor) {
              return addresses.find(addr => addr.id === row.home_address_id)?.address_line || 'No address'
            }
          },
          {
            key: 'instructor_tag',
            header: 'Tags',
            render: function(row: Instructor) { 
              return <TagDisplay entityId={row.id} entityType="instructor" tags={transformOtherTags(row.instructor_tag)} onTagChange={fetchData} />
            }
          }
        ]
      case 'bookings':
        return [
          { key: 'id', header: 'ID' },
          { 
            key: 'client_id', 
            header: 'Client',
            render: function(row: any) {
              const client = clients.find(c => c.id === row.client_id)
              return client ? `${client.first_name} ${client.last_name}` : 'Unknown'
            }
          },
          { 
            key: 'instructor_id', 
            header: 'Instructor',
            render: function(row: any) {
              const instructor = instructors.find(i => i.id === row.instructor_id)
              return instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown'
            }
          },
          { 
            key: 'start', 
            header: 'Start Time',
            render: function(row: any) { return new Date(row.start).toLocaleString() }
          },
          { 
            key: 'end', 
            header: 'End Time',
            render: function(row: any) { return new Date(row.end).toLocaleString() }
          },
          { key: 'status', header: 'Status' },
          {
            key: 'booking_tag',
            header: 'Tags',
            render: function(row: any) { 
              return <TagDisplay entityId={row.id} entityType="booking" tags={transformOtherTags(row.booking_tag)} onTagChange={fetchData} />
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
            render: function(row: Address) { return `(${row.latitude}, ${row.longitude})` }
          },
          {
            key: 'address_tag',
            header: 'Tags',
            render: function(row: Address) { 
              return <TagDisplay entityId={row.id} entityType="address" tags={transformOtherTags(row.address_tag)} onTagChange={fetchData} />
            }
          }
        ]
      case 'availabilities':
        return [
          { key: 'id', header: 'ID' },
          { 
            key: 'instructor_id', 
            header: 'Instructor',
            render: function(row: Availability) {
              const instructor = instructors.find(i => i.id === row.instructor_id)
              return instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown'
            }
          },
          { 
            key: 'start_date', 
            header: 'Start Date',
            render: function(row: Availability) { return new Date(row.start_date).toLocaleDateString() },
            editable: true
          },
          { 
            key: 'end_date', 
            header: 'End Date',
            render: function(row: Availability) { return new Date(row.end_date).toLocaleDateString() },
            editable: true
          },
          { key: 'timerange', header: 'Time Range', editable: true },
          { 
            key: 'color', 
            header: 'Color',
            render: function(row: Availability) {
              return (
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
              )
            },
            editable: true
          }
        ]
      default:
        return []
    }
  }

  return (
    <div className="data-tab">
      <DataManager
        clients={clients}
        instructors={instructors}
        addresses={addresses}
        bookings={bookings}
        availabilities={availabilities}
        fetchData={fetchData}
      >
        {({ 
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
        }) => (
          <>
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
                        availableTags={availableTags}
                      />
                      
                      {selectedRows.length > 0 && (
                        <DeleteButton 
                          selectedCount={selectedRows.length} 
                          onDelete={deleteSelectedRows}
                          selectedRows={selectedRows}
                          tableName={selectedTable === 'clients' ? 'client' : 
                                    selectedTable === 'instructors' ? 'instructor' :
                                    selectedTable === 'bookings' ? 'booking' :
                                    selectedTable === 'addresses' ? 'address' : 'availability'}
                        />
                      )}
                    </div>

                    <div className="search-actions-right">
                      <AddButton 
                        table={selectedTable === 'clients' ? 'client' : 
                              selectedTable === 'instructors' ? 'instructor' :
                              selectedTable === 'bookings' ? 'booking' :
                              selectedTable === 'addresses' ? 'address' : 'availability'}
                        fetchData={fetchData}
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
                    columns={getColumns(selectedTable, userEmails)}
                    tableName={selectedTable === 'clients' ? 'client' : 
                              selectedTable === 'instructors' ? 'instructor' :
                              selectedTable === 'bookings' ? 'booking' :
                              selectedTable === 'addresses' ? 'address' : 'availability'}
                    onRowSelect={handleRowSelect}
                    selectedRows={selectedRows}
                    fetchData={fetchData}
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
          </>
        )}
      </DataManager>
    </div>
  )
} 