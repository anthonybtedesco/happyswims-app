import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  schema?: string
}

interface UseRealtimeOptions {
  enabled?: boolean
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void
  onError?: (error: any) => void
}

export function useRealtime(
  options: RealtimeSubscriptionOptions,
  callbacks: UseRealtimeOptions = {}
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { enabled = true } = callbacks

  useEffect(() => {
    if (!enabled) return

    const channelName = `realtime_${options.table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const channel = supabase.channel(channelName)
    
    console.log(`Setting up realtime subscription for ${options.table}:`, {
      filter: options.filter,
      event: options.event || '*',
      schema: options.schema || 'public'
    })
    
    const subscription = channel.on(
      'postgres_changes',
      {
        event: options.event || '*',
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter
      },
      (payload: any) => {
        console.log(`Realtime event received for ${options.table}:`, {
          eventType: payload.eventType,
          table: payload.table,
          schema: payload.schema,
          new: payload.new,
          old: payload.old,
          filter: options.filter
        })
        
        switch (payload.eventType) {
          case 'INSERT':
            console.log(`INSERT event for ${options.table}:`, payload.new)
            callbacks.onInsert?.(payload)
            break
          case 'UPDATE':
            console.log(`UPDATE event for ${options.table}:`, payload.new)
            callbacks.onUpdate?.(payload)
            break
          case 'DELETE':
            console.log(`DELETE event for ${options.table}:`, payload.old)
            callbacks.onDelete?.(payload)
            break
          default:
            console.log(`Unknown event type for ${options.table}:`, payload.eventType)
        }
      }
    )

    subscription.subscribe((status: string) => {
      console.log(`Realtime subscription status for ${options.table}:`, status)
      if (status === 'CHANNEL_ERROR') {
        console.error(`Realtime subscription failed for ${options.table}:`, status)
        callbacks.onError?.(new Error(`Realtime subscription failed: ${status}`))
      } else if (status === 'SUBSCRIBED') {
        console.log(`Realtime subscription successful for ${options.table}`)
      }
    })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log(`Cleaning up realtime subscription for ${options.table}`)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, options.table, options.event, options.filter, options.schema])

  return {
    channel: channelRef.current
  }
} 