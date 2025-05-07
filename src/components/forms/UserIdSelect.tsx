import React, { useState, useEffect, useRef } from 'react'

interface UserIdSelectProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export default function UserIdSelect({ value, onChange, required }: UserIdSelectProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<{id: string, email: string}[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Fetch all users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])
  
  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  async function fetchUsers() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/list-all-users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      if (data.users) {
        const usersList = Object.entries(data.users).map(([id, email]) => ({
          id,
          email: email as string
        }))
        setUsers(usersList)
      }
    } catch (error: any) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function createNewUser(email: string) {
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address')
      return null
    }
    
    try {
      const response = await fetch('/api/auth/admin-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          role: 'client'
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }
      
      // Add the new user to the list
      const newUser = { id: data.user.id, email: data.user.email }
      setUsers(prev => [...prev, newUser])
      
      return data.user.id
    } catch (error: any) {
      console.error('Error creating user:', error)
      setErrorMessage(error.message || 'Failed to create user')
      return null
    }
  }
  
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Find selected user's email
  const selectedUserEmail = users.find(user => user.id === value)?.email || ''
  
  return (
    <div className="user-id-select" ref={dropdownRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div 
            className="selected-user" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              color: value ? '#000' : '#6b7280',
              flex: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>{value ? selectedUserEmail : 'Select user...'}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreatingUser(true)
              setShowDropdown(false)
            }}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Create User
          </button>
        </div>
        
        {showDropdown && (
          <div
            className="dropdown-menu"
            style={{
              position: 'absolute',
              top: '40px',
              left: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: 'white',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #d1d5db',
              marginTop: '4px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            <div className="search-container" style={{ padding: '8px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email..."
                className="search-input"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            
            <div className="options-container" style={{ padding: '8px 0' }}>
              {isLoading ? (
                <div
                  className="loading"
                  style={{
                    padding: '8px 12px',
                    color: '#6b7280',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  Loading users...
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`option ${user.id === value ? 'selected' : ''}`}
                    onClick={() => {
                      onChange(user.id)
                      setShowDropdown(false)
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      backgroundColor: user.id === value ? '#f3f4f6' : 'transparent',
                      color: '#000',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = user.id === value ? '#f3f4f6' : 'transparent'
                    }}
                  >
                    {user.email}
                  </div>
                ))
              ) : (
                <div
                  className="no-options"
                  style={{
                    padding: '8px 12px',
                    color: '#6b7280',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  No users found
                </div>
              )}
            </div>
          </div>
        )}
        
        {creatingUser && (
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '12px', 
            borderRadius: '6px',
            border: '1px solid #bfdbfe'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Create New User</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => {
                  setNewUserEmail(e.target.value)
                  setErrorMessage('')
                }}
                placeholder="Enter email address"
                className="form-input"
                style={{ backgroundColor: 'white', flexGrow: 1 }}
              />
              <button
                type="button"
                onClick={async () => {
                  const userId = await createNewUser(newUserEmail)
                  if (userId) {
                    onChange(userId)
                    setCreatingUser(false)
                    setNewUserEmail('')
                  }
                }}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingUser(false)
                  setNewUserEmail('')
                  setErrorMessage('')
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
            {errorMessage && (
              <div style={{ color: '#ef4444', fontSize: '14px' }}>
                {errorMessage}
              </div>
            )}
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              This will create a new Supabase user and send a password reset email
            </small>
          </div>
        )}
      </div>
      
      {/* Hidden input for form validation */}
      <input 
        type="hidden" 
        value={value}
        required={required}
      />
    </div>
  )
} 