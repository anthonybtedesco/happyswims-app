import React, { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface EditingCell {
  rowId: string
  column: string
  value: string
}

interface DataTableProps {
  data: any[]
  columns: {
    key: string
    header: string
    editable?: boolean
    render?: (row: any) => React.ReactNode
    width?: number // Optional default width
  }[]
  tableName: string
  onRowSelect?: (rowId: string) => void
  selectedRows?: string[]
  fetchData?: () => Promise<void>
}

export default function DataTable({
  data,
  columns,
  tableName,
  onRowSelect,
  selectedRows = [],
  fetchData
}: DataTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [startX, setStartX] = useState<number>(0)
  const [startWidth, setStartWidth] = useState<number>(0)
  const tableRef = useRef<HTMLDivElement>(null)

  // Initialize column widths with defaults or minimum width
  useEffect(() => {
    const initialWidths: Record<string, number> = {}
    columns.forEach(column => {
      initialWidths[column.key] = column.width || 150 // Default width if not specified
    })
    setColumnWidths(initialWidths)
  }, [columns])

  const handleCellChange = async (e: React.ChangeEvent<HTMLInputElement>, rowId: string, column: string) => {
    const value = e.target.value
    setEditingCell({rowId, column, value})
  }

  const handleCellBlur = async () => {
    if (!editingCell || !fetchData) return

    try {
      const { rowId, column, value } = editingCell
      const { error } = await supabase
        .from(tableName)
        .update({ [column]: value })
        .eq('id', rowId)

      if (error) throw error
      
      fetchData()
    } catch (err: any) {
      console.error('Error updating cell:', err)
    }

    setEditingCell(null)
  }

  const renderCheckbox = (rowId: string) => {
    if (!onRowSelect) return null
    
    return (
      <td className="cell-checkbox">
        <input
          type="checkbox"
          checked={selectedRows.includes(rowId)}
          onChange={() => onRowSelect(rowId)}
          className="row-checkbox"
        />
      </td>
    )
  }

  // Handle column resize start
  function handleResizeStart(e: React.MouseEvent, columnKey: string) {
    setResizingColumn(columnKey)
    setStartX(e.clientX)
    setStartWidth(columnWidths[columnKey] || 150)
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    e.preventDefault()
  }

  // Handle column resize move
  function handleResizeMove(e: MouseEvent) {
    if (!resizingColumn) return
    
    const diff = e.clientX - startX
    const newWidth = Math.max(80, startWidth + diff) // Minimum 80px width
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }

  // Handle column resize end
  function handleResizeEnd() {
    setResizingColumn(null)
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }

  return (
    <div className="table-container" ref={tableRef}>
      <div className="table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              {onRowSelect && <th className="checkbox-column"></th>}
              {columns.map(column => (
                <th 
                  key={column.key} 
                  style={{ width: `${columnWidths[column.key] || 150}px`, minWidth: `${columnWidths[column.key] || 150}px` }}
                  className={resizingColumn === column.key ? 'resizing' : ''}
                >
                  <div className="th-content">
                    <span className="column-title">{column.header}</span>
                    <div 
                      className="resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, column.key)}
                    ></div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.id}>
                {onRowSelect && renderCheckbox(row.id)}
                {columns.map(column => {
                  const cellStyle = {
                    width: `${columnWidths[column.key] || 150}px`,
                    minWidth: `${columnWidths[column.key] || 150}px`,
                  }
                  
                  if (column.render) {
                    return (
                      <td key={column.key} style={cellStyle}>
                        {column.render(row)}
                      </td>
                    )
                  }
                  
                  if (column.editable) {
                    return (
                      <td key={column.key} className="cell-editable" style={cellStyle}>
                        {editingCell && editingCell.rowId === row.id && editingCell.column === column.key ? (
                          <input 
                            value={editingCell.value} 
                            onChange={(e) => handleCellChange(e, row.id, column.key)}
                            onBlur={handleCellBlur}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          <div onClick={() => setEditingCell({rowId: row.id, column: column.key, value: row[column.key] || ''})}>
                            {row[column.key]}
                            <span className="edit-indicator"></span>
                          </div>
                        )}
                      </td>
                    )
                  }
                  
                  return (
                    <td key={column.key} className="cell-readonly" style={cellStyle}>
                      {row[column.key]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 