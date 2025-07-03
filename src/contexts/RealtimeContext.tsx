'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeContextType {
  subscribe: (table: string, filter?: string, callback?: (payload: RealtimePostgresChangesPayload<any>) => void) => string
  unsubscribe: (subscriptionId: string) => void
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface Subscription {
  id: string
  channel: RealtimeChannel
  table: string
  filter?: string
  callback?: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map())
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const channel = supabase.channel('connection_status')
    
    channel
      .on('system', { event: 'disconnect' }, () => {
        setIsConnected(false)
      })
      .on('system', { event: 'connect' }, () => {
        setIsConnected(true)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function subscribe(table: string, filter?: string, callback?: (payload: RealtimePostgresChangesPayload<any>) => void): string {
    const subscriptionId = `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const channel = supabase.channel(subscriptionId)
    
    const subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter
      },
      (payload: RealtimePostgresChangesPayload<any>) => {
        callback?.(payload)
      }
    )

    subscription.subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        console.error(`Realtime subscription error for ${table}:`, status)
      }
    })

    const newSubscription: Subscription = {
      id: subscriptionId,
      channel,
      table,
      filter,
      callback
    }

    setSubscriptions(prev => new Map(prev).set(subscriptionId, newSubscription))

    return subscriptionId
  }

  function unsubscribe(subscriptionId: string) {
    const subscription = subscriptions.get(subscriptionId)
    if (subscription) {
      supabase.removeChannel(subscription.channel)
      setSubscriptions(prev => {
        const newMap = new Map(prev)
        newMap.delete(subscriptionId)
        return newMap
      })
    }
  }

  useEffect(() => {
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription.channel)
      })
    }
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider')
  }
  return context
} 