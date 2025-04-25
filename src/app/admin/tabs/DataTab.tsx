'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Address, Instructor, Client, Availability } from '@/lib/types/supabase'
import MapComponent from '@/lib/mapbox/MapComponent'
import Calendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventSourceInput } from '@fullcalendar/core'

interface DataTabProps {
  clients: Client[]
  instructors: Instructor[]
  addresses: Address[]
  bookings: any[]
  availabilities: Availability[]
  fetchData: () => Promise<void>
}

interface UserWithEmail {
  id: string;
  email: string;
}

export default function DataTab({
  clients,
  instructors,
  addresses,
  bookings,
  availabilities,
  fetchData
}: DataTabProps) {
  const [selectedTable, setSelectedTable] = useState('clients')
  const [editingCell, setEditingCell] = useState<{rowId: string, column: string, value: string} | null>(null)
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})
  const [isMapExpanded, setIsMapExpanded] = useState(true)
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUserEmails = async () => {
      const userIds = [...clients, ...instructors].map(u => u.user_id)
      
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
              selectedTable === 'bookings' ? 'booking' : 'address')
        .update({ [column]: value })
        .eq('id', rowId)

      if (error) throw error
      
      fetchData()
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

  const getFilteredTableData = () => {
    switch (selectedTable) {
      case 'clients':
        return filterData(clients)
      case 'instructors':
        return filterData(instructors)
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

  const getFilteredAddresses = () => {
    if (selectedRows.length === 0) {
      return addresses
    }

    switch (selectedTable) {
      case 'clients':
        return addresses.filter(addr => 
          clients
            .filter(client => selectedRows.includes(client.id))
            .some(client => client.home_address_id === addr.id)
        )
      case 'instructors':
        return addresses.filter(addr => 
          instructors
            .filter(instructor => selectedRows.includes(instructor.id))
            .some(instructor => instructor.home_address_id === addr.id)
        )
      default:
        return addresses
    }
  }

  const getFilteredBookings = () => {
    if (selectedRows.length === 0) {
      return bookings
    }

    switch (selectedTable) {
      case 'clients':
        return bookings.filter(booking => 
          selectedRows.includes(booking.client_id)
        )
      case 'instructors':
        return bookings.filter(booking => 
          selectedRows.includes(booking.instructor_id)
        )
      default:
        return bookings
    }
  }

  const getCalendarEvents = (): EventSourceInput => {
    const bookingEvents = getFilteredBookings().map(booking => ({
      id: booking.id,
      start: booking.start_time,
      end: booking.end_time,
      title: `Booking: ${clients.find(c => c.id === booking.client_id)?.first_name || 'Unknown'} ${clients.find(c => c.id === booking.client_id)?.last_name || ''} with ${instructors.find(i => i.id === booking.instructor_id)?.first_name || 'Unknown'} ${instructors.find(i => i.id === booking.instructor_id)?.last_name || ''}`,
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
    }))

    const availabilityEvents = availabilities
      .filter(availability => selectedRows.length === 0 || selectedRows.includes(availability.id))
      .map(availability => {
        try {
          if (!availability.timerange || !availability.timerange.includes('-')) {
            return {
              id: `avail-${availability.id}`,
              start: availability.start_date,
              end: availability.end_date,
              title: `Available: ${instructors.find(i => i.id === availability.instructor_id)?.first_name || 'Unknown'} ${instructors.find(i => i.id === availability.instructor_id)?.last_name || ''}`,
              backgroundColor: availability.color || '#10b981',
              borderColor: availability.color || '#10b981',
              display: 'block',
              allDay: true
            }
          }

          const [startTime, endTime] = availability.timerange.split('-')
          
          if (!startTime || !endTime) {
            throw new Error(`Invalid time range format: ${availability.timerange}`)
          }

          const startDate = new Date(availability.start_date)
          const endDate = new Date(availability.end_date)
          
          const [startHours, startMinutes] = startTime.split(':').map(Number)
          const [endHours, endMinutes] = endTime.split(':').map(Number)
          
          if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
            throw new Error(`Invalid time values in range: ${availability.timerange}`)
          }

          startDate.setHours(startHours, startMinutes, 0)
          endDate.setHours(endHours, endMinutes, 0)

          const formatTime = (hours: number, minutes: number) => {
            const period = hours >= 12 ? 'PM' : 'AM'
            const displayHours = hours % 12 || 12
            return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
          }

          const displayStartTime = formatTime(startHours, startMinutes)
          const displayEndTime = formatTime(endHours, endMinutes)

          return {
            id: `avail-${availability.id}`,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            title: `Available: ${instructors.find(i => i.id === availability.instructor_id)?.first_name || 'Unknown'} ${instructors.find(i => i.id === availability.instructor_id)?.last_name || ''} (${displayStartTime} - ${displayEndTime})`,
            backgroundColor: availability.color || '#10b981',
            borderColor: availability.color || '#10b981',
            display: 'block',
            allDay: false
          }
        } catch (err) {
          console.error('Error processing availability:', err, 'Availability:', availability)
          return {
            id: `avail-${availability.id}`,
            start: availability.start_date,
            end: availability.end_date,
            title: `Available: ${instructors.find(i => i.id === availability.instructor_id)?.first_name || 'Unknown'} ${instructors.find(i => i.id === availability.instructor_id)?.last_name || ''} (Error with time range)`,
            backgroundColor: availability.color || '#10b981',
            borderColor: availability.color || '#10b981',
            display: 'block',
            allDay: true
          }
        }
      })

    return [...bookingEvents, ...availabilityEvents]
  }

  const renderTableData = () => {
    const renderCheckbox = (rowId: string) => (
      <td className="cell-checkbox">
        <input
          type="checkbox"
          checked={selectedRows.includes(rowId)}
          onChange={() => handleRowSelect(rowId)}
          className="row-checkbox"
        />
      </td>
    )

    const filteredData = getFilteredTableData()

    switch (selectedTable) {
      case 'clients':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(client => (
                  <tr key={client.id}>
                    {renderCheckbox(client.id)}
                    <td className="cell-readonly">{client.id}</td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === client.id && editingCell.column === 'first_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, client.id, 'first_name', 'client')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: client.id, column: 'first_name', value: client.first_name})}>
                          {client.first_name}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === client.id && editingCell.column === 'last_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, client.id, 'last_name', 'client')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: client.id, column: 'last_name', value: client.last_name})}>
                          {client.last_name}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-readonly">
                      {userEmails[client.user_id] || 'No email'}
                    </td>
                    <td className="cell-readonly">
                      {addresses.find(addr => addr.id === client.home_address_id)?.address_line || 'No address'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'instructors':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(instructor => (
                  <tr key={instructor.id}>
                    {renderCheckbox(instructor.id)}
                    <td className="cell-readonly">{instructor.id}</td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === instructor.id && editingCell.column === 'first_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, instructor.id, 'first_name', 'instructor')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: instructor.id, column: 'first_name', value: instructor.first_name})}>
                          {instructor.first_name}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === instructor.id && editingCell.column === 'last_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, instructor.id, 'last_name', 'instructor')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: instructor.id, column: 'last_name', value: instructor.last_name})}>
                          {instructor.last_name}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-readonly">
                      {userEmails[instructor.user_id] || 'No email'}
                    </td>
                    <td className="cell-readonly">
                      {addresses.find(addr => addr.id === instructor.home_address_id)?.address_line || 'No address'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'bookings':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Instructor</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(booking => (
                  <tr key={booking.id}>
                    {renderCheckbox(booking.id)}
                    <td className="cell-readonly">{booking.id}</td>
                    <td className="cell-readonly">
                      {clients.find(client => client.id === booking.client_id)?.first_name || 'Unknown'} {clients.find(client => client.id === booking.client_id)?.last_name || ''}
                    </td>
                    <td className="cell-readonly">
                      {instructors.find(inst => inst.id === booking.instructor_id)?.first_name || 'Unknown'} {instructors.find(inst => inst.id === booking.instructor_id)?.last_name || ''}
                    </td>
                    <td className="cell-readonly">{new Date(booking.start).toLocaleString()}</td>
                    <td className="cell-readonly">{new Date(booking.end).toLocaleString()}</td>
                    <td className="cell-readonly">
                      {booking.status || 'scheduled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'addresses':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>ID</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(address => (
                  <tr key={address.id}>
                    {renderCheckbox(address.id)}
                    <td className="cell-readonly">{address.id}</td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'address_line' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'address_line', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'address_line', value: address.address_line})}>
                          {address.address_line}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'city' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'city', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'city', value: address.city})}>
                          {address.city}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'state' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'state', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'state', value: address.state})}>
                          {address.state}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'zip' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'zip', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'zip', value: address.zip})}>
                          {address.zip}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-readonly">
                      ({address.latitude}, {address.longitude})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'availabilities':
        return (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-column"></th>
                  <th>ID</th>
                  <th>Instructor</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Time Range</th>
                  <th>Color</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(availability => (
                  <tr key={availability.id}>
                    {renderCheckbox(availability.id)}
                    <td className="cell-readonly">{availability.id}</td>
                    <td className="cell-readonly">
                      {instructors.find(inst => inst.id === availability.instructor_id)?.first_name || 'Unknown'} {instructors.find(inst => inst.id === availability.instructor_id)?.last_name || ''}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === availability.id && editingCell.column === 'start_date' ? (
                        <input 
                          type="date"
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, availability.id, 'start_date', 'availability')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: availability.id, column: 'start_date', value: availability.start_date})}>
                          {new Date(availability.start_date).toLocaleDateString()}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === availability.id && editingCell.column === 'end_date' ? (
                        <input 
                          type="date"
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, availability.id, 'end_date', 'availability')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: availability.id, column: 'end_date', value: availability.end_date})}>
                          {new Date(availability.end_date).toLocaleDateString()}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === availability.id && editingCell.column === 'timerange' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, availability.id, 'timerange', 'availability')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input"
                          placeholder="HH:MM-HH:MM"
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: availability.id, column: 'timerange', value: availability.timerange || ''})}>
                          {availability.timerange || 'Not set'}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                    <td className="cell-editable">
                      {editingCell && editingCell.rowId === availability.id && editingCell.column === 'color' ? (
                        <input 
                          type="color"
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, availability.id, 'color', 'availability')}
                          onBlur={handleCellBlur}
                          autoFocus
                          className="cell-input color-input"
                        />
                      ) : (
                        <div 
                          onClick={() => setEditingCell({rowId: availability.id, column: 'color', value: availability.color || '#10b981'})}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <div 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              backgroundColor: availability.color || '#10b981',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0'
                            }} 
                          />
                          {availability.color || '#10b981'}
                          <span className="edit-indicator"></span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="data-tab">
      <style>
        {`
          .data-tab {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: #f8fafc;
            padding: 24px;
            border-radius: 12px;
          }
          
          .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 0;
            background: #fff;
            padding: 4px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .tab-button {
            padding: 12px 24px;
            background-color: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            color: #64748b;
            transition: all 0.2s ease;
            position: relative;
          }
          
          .tab-button:hover {
            background-color: #f1f5f9;
            color: #334155;
          }
          
          .tab-button.active {
            background-color: #e2e8f0;
            color: #0f172a;
            font-weight: 600;
          }
          
          .tab-content {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin-top: 16px;
          }
          
          .table-container {
            overflow-x: auto;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            background: #ffffff;
            margin-top: 16px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
          }
          
          .data-table th {
            text-align: left;
            padding: 16px;
            background-color: #f8fafc;
            border-bottom: 2px solid #e2e8f0;
            color: #475569;
            font-weight: 600;
            position: sticky;
            top: 0;
          }
          
          .data-table td {
            padding: 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .data-table tr:last-child td {
            border-bottom: none;
          }
          
          .data-table tr:hover {
            background-color: #f8fafc;
          }
          
          .cell-readonly, 
          .cell-editable div {
            padding: 14px 16px;
            height: 100%;
            position: relative;
          }
          
          .cell-editable {
            position: relative;
            cursor: pointer;
          }
          
          .cell-editable div {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .edit-indicator {
            opacity: 0;
            width: 14px;
            height: 14px;
            margin-left: 6px;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            transition: opacity 0.2s ease;
          }
          
          .cell-editable:hover .edit-indicator {
            opacity: 1;
          }
          
          .cell-editable:hover {
            background-color: #f0f7ff;
          }
          
          .cell-editable:hover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 3px;
            height: 100%;
            background-color: #3b82f6;
            opacity: 0.6;
          }
          
          .cell-input {
            width: 100%;
            padding: 13px 15px;
            font-size: 14px;
            border: 2px solid #3b82f6;
            border-radius: 6px;
            height: 100%;
            outline: none;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            background-color: #ffffff;
          }
          
          .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 16px;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
          }
          
          .section-header:hover {
            background-color: #f8fafc;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .section-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-content {
            margin-bottom: 24px;
            transition: all 0.3s ease;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          
          .checkbox-column {
            width: 48px;
          }
          
          .cell-checkbox {
            padding: 12px 16px;
            text-align: center;
          }
          
          .row-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
            border-radius: 4px;
            border: 2px solid #cbd5e1;
            appearance: none;
            background-color: #ffffff;
            margin: 0;
            transition: all 0.2s ease;
          }
          
          .row-checkbox:checked {
            background-color: #3b82f6;
            border-color: #3b82f6;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: center;
          }
          
          .row-checkbox:hover {
            border-color: #3b82f6;
          }
          
          .collapse-icon {
            width: 20px;
            height: 20px;
            transition: transform 0.3s ease;
            color: #64748b;
          }
          
          .collapse-icon.expanded {
            transform: rotate(180deg);
          }

          /* Calendar Styles */
          .fc {
            background: #ffffff;
            border-radius: 10px;
            padding: 16px;
            font-family: 'Inter', sans-serif;
          }

          .fc .fc-toolbar-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #334155;
          }

          .fc .fc-button-primary {
            background-color: #3b82f6;
            border-color: #3b82f6;
            text-transform: capitalize;
            font-weight: 500;
            padding: 8px 16px;
            transition: all 0.2s ease;
          }

          .fc .fc-button-primary:hover {
            background-color: #2563eb;
            border-color: #2563eb;
          }

          .fc .fc-button-primary:not(:disabled).fc-button-active,
          .fc .fc-button-primary:not(:disabled):active {
            background-color: #1d4ed8;
            border-color: #1d4ed8;
          }

          .fc-theme-standard td, 
          .fc-theme-standard th {
            border-color: #f1f5f9;
          }

          .fc .fc-day-today {
            background-color: #f0f7ff !important;
          }

          .fc-event {
            border-radius: 6px;
            padding: 2px 4px;
            font-size: 12px;
          }

          .color-input {
            padding: 2px;
            width: 100px;
            height: 40px;
          }

          .search-container {
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .search-input {
            flex: 1;
            padding: 12px 36px;
            font-size: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background-color: white;
            transition: all 0.2s ease;
          }

          .search-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .search-input::placeholder {
            color: #94a3b8;
          }

          .search-icon {
            color: #64748b;
            margin-right: -32px;
            z-index: 1;
          }

          .clear-search {
            padding: 8px;
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            margin-left: -32px;
            z-index: 1;
            opacity: 0.7;
            transition: opacity 0.2s ease;
          }

          .clear-search:hover {
            opacity: 1;
          }
        `}
      </style>
      <div className="tab-buttons">
        <button 
          onClick={() => setSelectedTable('clients')}
          className={`tab-button ${selectedTable === 'clients' ? 'active' : ''}`}
        >
          Clients
        </button>
        <button 
          onClick={() => setSelectedTable('instructors')}
          className={`tab-button ${selectedTable === 'instructors' ? 'active' : ''}`}
        >
          Instructors
        </button>
        <button 
          onClick={() => setSelectedTable('bookings')}
          className={`tab-button ${selectedTable === 'bookings' ? 'active' : ''}`}
        >
          Bookings
        </button>
        <button 
          onClick={() => setSelectedTable('addresses')}
          className={`tab-button ${selectedTable === 'addresses' ? 'active' : ''}`}
        >
          Addresses
        </button>
        <button 
          onClick={() => setSelectedTable('availabilities')}
          className={`tab-button ${selectedTable === 'availabilities' ? 'active' : ''}`}
        >
          Availabilities
        </button>
      </div>
      <div className="tab-content">

        <div className="section-header" onClick={() => setIsMapExpanded(!isMapExpanded)}>
          <h3>Map View</h3>
          <svg
            className={`collapse-icon ${isMapExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {isMapExpanded && (
          <div className="section-content">
            <MapComponent
              addresses={getFilteredAddresses()}
              height="400px"
            />
          </div>
        )}

        <div className="section-header" onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}>
          <h3>Calendar View</h3>
          <svg
            className={`collapse-icon ${isCalendarExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isCalendarExpanded && (
          <div className="section-content">
            <Calendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={getCalendarEvents()}
              height="400px"
              firstDay={1}
            />
          </div>
        )}
        <div className="search-container">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${selectedTable}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {renderTableData()}
      </div>
    </div>
  )
} 