export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      address: {
        Row: {
          address_line: string | null
          city: string | null
          coordinates: Json | null
          created_at: string
          id: string
          state: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      admin: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          color: string
          created_at: string
          end_date: string
          id: string
          instructor_id: string
          start_date: string
          timerange: string
        }
        Insert: {
          color: string
          created_at?: string
          end_date: string
          id?: string
          instructor_id: string
          start_date: string
          timerange: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string
          id?: string
          instructor_id?: string
          start_date?: string
          timerange?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor"
            referencedColumns: ["id"]
          },
        ]
      }
      booking: {
        Row: {
          booking_status: Database["public"]["Enums"]["BookingStatus"]
          calendar_event_id: string | null
          client_id: string | null
          created_at: string
          duration: number | null
          end_time: string | null
          google_event_link: string | null
          id: string
          instructor_id: string | null
          payment_status: Database["public"]["Enums"]["PaymentStatus"]
          pool_address: string | null
          recurrence_weeks: number | null
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          booking_status?: Database["public"]["Enums"]["BookingStatus"]
          calendar_event_id?: string | null
          client_id?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          google_event_link?: string | null
          id?: string
          instructor_id?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          pool_address?: string | null
          recurrence_weeks?: number | null
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          booking_status?: Database["public"]["Enums"]["BookingStatus"]
          calendar_event_id?: string | null
          client_id?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          google_event_link?: string | null
          id?: string
          instructor_id?: string | null
          payment_status?: Database["public"]["Enums"]["PaymentStatus"]
          pool_address?: string | null
          recurrence_weeks?: number | null
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_pool_address_fkey"
            columns: ["pool_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          created_at: string
          first_name: string | null
          home_address: string | null
          id: string
          last_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          home_address?: string | null
          id?: string
          last_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          home_address?: string | null
          id?: string
          last_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_home_address_fkey"
            columns: ["home_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor: {
        Row: {
          created_at: string
          first_name: string | null
          home_address: string | null
          id: string
          last_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          home_address?: string | null
          id?: string
          last_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          home_address?: string | null
          id?: string
          last_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_home_address_fkey"
            columns: ["home_address"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          created_at: string
          description: string | null
          id: string
          price: number | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          title?: string | null
        }
        Relationships: []
      }
      swimmer: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swimmer_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      BookingStatus:
        | "INTERESTED"
        | "SCHEDULED"
        | "BOOKED"
        | "COMPLETED"
        | "CANCELLED"
        | "IGNORED"
      PaymentStatus: "PENDING" | "DEPOSIT" | "PAID" | "REFUNDED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
