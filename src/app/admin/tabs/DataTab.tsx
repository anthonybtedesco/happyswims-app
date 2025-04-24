'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Address, Instructor, Client } from '@/lib/types/supabase'

interface DataTabProps {
  clients: Client[]
  instructors: Instructor[]
  addresses: Address[]
  bookings: any[]
  fetchData: () => Promise<void>
}

export default function DataTab({
  clients,
  instructors,
  addresses,
  bookings,
  fetchData
}: DataTabProps) {
  const [selectedTable, setSelectedTable] = useState('clients')
  const [editingCell, setEditingCell] = useState<{rowId: string, column: string, value: string} | null>(null)

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

  const renderTableData = () => {
    switch (selectedTable) {
      case 'clients':
        return (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>First Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Last Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{client.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === client.id && editingCell.column === 'first_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, client.id, 'first_name', 'client')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: client.id, column: 'first_name', value: client.first_name})}>
                          {client.first_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === client.id && editingCell.column === 'last_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, client.id, 'last_name', 'client')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: client.id, column: 'last_name', value: client.last_name})}>
                          {client.last_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
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
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>First Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Last Name</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map(instructor => (
                  <tr key={instructor.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{instructor.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === instructor.id && editingCell.column === 'first_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, instructor.id, 'first_name', 'instructor')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: instructor.id, column: 'first_name', value: instructor.first_name})}>
                          {instructor.first_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === instructor.id && editingCell.column === 'last_name' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, instructor.id, 'last_name', 'instructor')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: instructor.id, column: 'last_name', value: instructor.last_name})}>
                          {instructor.last_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
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
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Client</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Instructor</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Start Time</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>End Time</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{booking.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {clients.find(client => client.id === booking.client_id)?.first_name || 'Unknown'} {clients.find(client => client.id === booking.client_id)?.last_name || ''}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {instructors.find(inst => inst.id === booking.instructor_id)?.first_name || 'Unknown'} {instructors.find(inst => inst.id === booking.instructor_id)?.last_name || ''}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{new Date(booking.start).toLocaleString()}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{new Date(booking.end).toLocaleString()}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
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
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Address</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>City</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>State</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>ZIP</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map(address => (
                  <tr key={address.id}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{address.id}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'address_line' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'address_line', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'address_line', value: address.address_line})}>
                          {address.address_line}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'city' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'city', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'city', value: address.city})}>
                          {address.city}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'state' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'state', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'state', value: address.state})}>
                          {address.state}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      {editingCell && editingCell.rowId === address.id && editingCell.column === 'zip' ? (
                        <input 
                          value={editingCell.value} 
                          onChange={(e) => handleCellChange(e, address.id, 'zip', 'address')}
                          onBlur={handleCellBlur}
                          autoFocus
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <div onClick={() => setEditingCell({rowId: address.id, column: 'zip', value: address.zip})}>
                          {address.zip}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                      ({address.latitude}, {address.longitude})
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
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '1px', marginBottom: '20px' }}>
          <button 
            onClick={() => setSelectedTable('clients')}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedTable === 'clients' ? '#f0f0f0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: selectedTable === 'clients' ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontWeight: selectedTable === 'clients' ? 'bold' : 'normal',
              marginRight: '5px'
            }}
          >
            Clients
          </button>
          <button 
            onClick={() => setSelectedTable('instructors')}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedTable === 'instructors' ? '#f0f0f0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: selectedTable === 'instructors' ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontWeight: selectedTable === 'instructors' ? 'bold' : 'normal',
              marginRight: '5px'
            }}
          >
            Instructors
          </button>
          <button 
            onClick={() => setSelectedTable('bookings')}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedTable === 'bookings' ? '#f0f0f0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: selectedTable === 'bookings' ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontWeight: selectedTable === 'bookings' ? 'bold' : 'normal',
              marginRight: '5px'
            }}
          >
            Bookings
          </button>
          <button 
            onClick={() => setSelectedTable('addresses')}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedTable === 'addresses' ? '#f0f0f0' : 'transparent',
              border: '1px solid #ddd',
              borderRadius: selectedTable === 'addresses' ? '4px 4px 0 0' : '4px',
              cursor: 'pointer',
              fontWeight: selectedTable === 'addresses' ? 'bold' : 'normal'
            }}
          >
            Addresses
          </button>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '0 4px 4px 4px', padding: '20px' }}>
          {renderTableData()}
        </div>
      </div>
    </div>
  )
} 