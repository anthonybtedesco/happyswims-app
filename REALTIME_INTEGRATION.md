# Supabase Realtime Integration

This document describes the realtime integration features implemented in the HappySwims application.

## Overview

The application now includes comprehensive realtime functionality using Supabase Realtime, allowing for live updates across all components when data is created, updated, or deleted in the database.

## Features

### 1. Reusable Realtime Hook (`useRealtime`)

Located in `src/hooks/useRealtime.ts`, this custom hook provides a clean interface for subscribing to database changes:

```typescript
import { useRealtime } from '@/hooks/useRealtime'

// Subscribe to all changes on a table
useRealtime(
  { table: 'booking' },
  {
    onInsert: (payload) => console.log('New booking:', payload.new),
    onUpdate: (payload) => console.log('Updated booking:', payload.new),
    onDelete: (payload) => console.log('Deleted booking:', payload.old),
    onError: (error) => console.error('Realtime error:', error)
  }
)

// Subscribe with filters
useRealtime(
  { 
    table: 'availability',
    filter: 'instructor_id=eq.123'
  },
  {
    onInsert: () => loadAvailabilities(),
    onUpdate: () => loadAvailabilities(),
    onDelete: () => loadAvailabilities()
  }
)
```

### 2. Realtime Context Provider

Located in `src/contexts/RealtimeContext.tsx`, this provides a centralized way to manage realtime subscriptions across the application:

```typescript
import { RealtimeProvider, useRealtimeContext } from '@/contexts/RealtimeContext'

// Wrap your app
<RealtimeProvider>
  <YourApp />
</RealtimeProvider>

// Use in components
const { subscribe, unsubscribe, isConnected } = useRealtimeContext()
```

### 3. Components with Realtime Updates

#### Availability Components
- **Availability.tsx**: Weekly view of instructor availability with realtime updates
- **AvailabilityCalendar.tsx**: Calendar view with realtime updates

Both components automatically refresh when availability slots are created, updated, or deleted.

#### Booking Components
- **BookingList.tsx**: Displays bookings with realtime updates
- **BookingManager.tsx**: Create, edit, and delete bookings with immediate UI updates

### 4. Database Tables Enabled for Realtime

The following tables are configured for realtime updates:

- `availability` - Instructor availability slots
- `booking` - Class bookings
- `instructor` - Instructor profiles
- `client` - Client profiles
- `address` - Address information

## Implementation Details

### Database Configuration

Realtime is enabled at the database level through Supabase publications:

```sql
-- Tables are added to the realtime publication
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."availability";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."booking";
-- ... other tables
```

### Row Level Security (RLS)

All tables have RLS policies that ensure users can only see data they're authorized to access:

```sql
-- Example: Instructors can only see their own availability
CREATE POLICY "Instructors can manage their own availability" ON public.availability
    USING (instructor_id IN (SELECT id FROM public.instructor WHERE user_id = auth.uid()))
    WITH CHECK (instructor_id IN (SELECT id FROM public.instructor WHERE user_id = auth.uid()));
```

### Error Handling

The realtime system includes comprehensive error handling:

- Connection status monitoring
- Automatic reconnection
- Error logging and user feedback
- Graceful degradation when realtime is unavailable

## Usage Examples

### Basic Realtime Subscription

```typescript
function MyComponent() {
  const [data, setData] = useState([])
  
  useRealtime(
    { table: 'my_table' },
    {
      onInsert: (payload) => {
        setData(prev => [payload.new, ...prev])
      },
      onUpdate: (payload) => {
        setData(prev => 
          prev.map(item => 
            item.id === payload.new.id ? payload.new : item
          )
        )
      },
      onDelete: (payload) => {
        setData(prev => 
          prev.filter(item => item.id !== payload.old.id)
        )
      }
    }
  )
  
  return <div>{/* Your component */}</div>
}
```

### Filtered Realtime Subscription

```typescript
function InstructorDashboard({ instructorId }) {
  useRealtime(
    { 
      table: 'booking',
      filter: `instructor_id=eq.${instructorId}`
    },
    {
      onInsert: () => loadBookings(),
      onUpdate: () => loadBookings(),
      onDelete: () => loadBookings()
    }
  )
}
```

### Connection Status Monitoring

```typescript
function ConnectionStatus() {
  const { isConnected } = useRealtimeContext()
  
  return (
    <div className={isConnected ? 'connected' : 'disconnected'}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  )
}
```

## Performance Considerations

1. **Selective Subscriptions**: Only subscribe to tables and filters that are actually needed
2. **Efficient Updates**: Use optimistic updates when possible to provide immediate feedback
3. **Cleanup**: Always unsubscribe from realtime channels when components unmount
4. **Debouncing**: Consider debouncing rapid updates to prevent excessive re-renders

## Troubleshooting

### Common Issues

1. **No realtime updates**: Check that the table is added to the realtime publication
2. **Permission errors**: Verify RLS policies allow the current user to access the data
3. **Connection issues**: Check network connectivity and Supabase service status

### Debugging

Enable debug logging by checking the browser console for realtime-related messages. The system logs:
- Connection status changes
- Subscription errors
- Data change events (in development mode)

## Future Enhancements

1. **Optimistic Updates**: Implement optimistic UI updates for better perceived performance
2. **Batch Updates**: Group multiple realtime events to reduce re-renders
3. **Offline Support**: Cache data and sync when connection is restored
4. **Real-time Notifications**: Add push notifications for important changes 