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
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id}>
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
                  <th>ID</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Home Address</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map(instructor => (
                  <tr key={instructor.id}>
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
                  <th>ID</th>
                  <th>Client</th>
                  <th>Instructor</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id}>
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
                  <th>ID</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map(address => (
                  <tr key={address.id}>
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
          }
          
          .tab-buttons {
            display: flex;
            gap: 2px;
            margin-bottom: 0;
          }
          
          .tab-button {
            padding: 10px 20px;
            background-color: #f5f7fa;
            border: 1px solid #e1e5eb;
            border-bottom: none;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 500;
            color: #64748b;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
          }
          
          .tab-button:hover {
            background-color: #fff;
            color: #334155;
          }
          
          .tab-button.active {
            background-color: #fff;
            color: #334155;
            font-weight: 600;
            box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.03);
            z-index: 2;
          }
          
          .tab-content {
            background-color: #fff;
            border: 1px solid #e1e5eb;
            border-radius: 0 8px 8px 8px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            z-index: 1;
          }
          
          .table-container {
            overflow-x: auto;
            border-radius: 6px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          
          .data-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            font-size: 14px;
          }
          
          .data-table th {
            text-align: left;
            padding: 12px 16px;
            background-color: #f8fafc;
            border-bottom: 1px solid #e4e9f0;
            color: #64748b;
            font-weight: 600;
            position: sticky;
            top: 0;
          }
          
          .data-table td {
            padding: 0;
            border-bottom: 1px solid #f0f2f5;
          }
          
          .data-table tr:last-child td {
            border-bottom: none;
          }
          
          .data-table tr:hover {
            background-color: #f9fafc;
          }
          
          .cell-readonly, 
          .cell-editable div {
            padding: 12px 16px;
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
            padding: 11px 15px;
            font-size: 14px;
            border: 2px solid #3b82f6;
            border-radius: 0;
            height: 100%;
            outline: none;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            background-color
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
      </div>
      <div className="tab-content">
        {renderTableData()}
      </div>
    </div>
  )
} 