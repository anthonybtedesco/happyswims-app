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
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          state: string | null
          user_id: string | null
          zip: string | null
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Update: {
          address_line?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          state?: string | null
          user_id?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      address_tag: {
        Row: {
          address_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          address_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          address_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "address_tag_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "address_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
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
          pattern_type: string | null
          start_date: string
          timerange: string
        }
        Insert: {
          color: string
          created_at?: string
          end_date: string
          id?: string
          instructor_id: string
          pattern_type?: string | null
          start_date: string
          timerange: string
        }
        Update: {
          color?: string
          created_at?: string
          end_date?: string
          id?: string
          instructor_id?: string
          pattern_type?: string | null
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
      availability_exception: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          instructor_id: string
          pattern_id: string | null
          reason: string | null
          start_datetime: string
          status: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          instructor_id: string
          pattern_id?: string | null
          reason?: string | null
          start_datetime: string
          status?: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          instructor_id?: string
          pattern_id?: string | null
          reason?: string | null
          start_datetime?: string
          status?: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "availability_exception_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_exception_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "availability_pattern"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_pattern: {
        Row: {
          color: string
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string
          id: string
          instructor_id: string
          is_template: boolean | null
          name: string | null
          parent_pattern_id: string | null
          recurrence_day_of_week: number | null
          recurrence_days: number[] | null
          recurrence_interval: number | null
          recurrence_type: Database["public"]["Enums"]["RecurrenceType"]
          recurrence_week_of_month: number | null
          start_date: string
          start_time: string
          status: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time: string
          id?: string
          instructor_id: string
          is_template?: boolean | null
          name?: string | null
          parent_pattern_id?: string | null
          recurrence_day_of_week?: number | null
          recurrence_days?: number[] | null
          recurrence_interval?: number | null
          recurrence_type?: Database["public"]["Enums"]["RecurrenceType"]
          recurrence_week_of_month?: number | null
          start_date: string
          start_time: string
          status?: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string
          id?: string
          instructor_id?: string
          is_template?: boolean | null
          name?: string | null
          parent_pattern_id?: string | null
          recurrence_day_of_week?: number | null
          recurrence_days?: number[] | null
          recurrence_interval?: number | null
          recurrence_type?: Database["public"]["Enums"]["RecurrenceType"]
          recurrence_week_of_month?: number | null
          start_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["AvailabilityStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "availability_pattern_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_pattern_parent_pattern_id_fkey"
            columns: ["parent_pattern_id"]
            isOneToOne: false
            referencedRelation: "availability_pattern"
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
          pool_address_id: string | null
          recurrence_weeks: number | null
          start_time: string | null
          status: string
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
          pool_address_id?: string | null
          recurrence_weeks?: number | null
          start_time?: string | null
          status: string
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
          pool_address_id?: string | null
          recurrence_weeks?: number | null
          start_time?: string | null
          status?: string
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
            foreignKeyName: "booking_pool_address_id_fkey"
            columns: ["pool_address_id"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_tag: {
        Row: {
          booking_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_tag_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      client: {
        Row: {
          created_at: string
          first_name: string | null
          home_address_id: string | null
          id: string
          last_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          home_address_id?: string | null
          id?: string
          last_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          home_address_id?: string | null
          id?: string
          last_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_home_address_id_fkey"
            columns: ["home_address_id"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tag: {
        Row: {
          client_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tag_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor: {
        Row: {
          created_at: string
          first_name: string | null
          home_address_id: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          home_address_id?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          home_address_id?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_home_address_id_fkey"
            columns: ["home_address_id"]
            isOneToOne: false
            referencedRelation: "address"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_tag: {
        Row: {
          created_at: string
          instructor_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          instructor_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          instructor_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_tag_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
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
      student: {
        Row: {
          birthdate: string | null
          client_id: string | null
          created_at: string
          first_name: string | null
          id: string
        }
        Insert: {
          birthdate?: string | null
          client_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
        }
        Update: {
          birthdate?: string | null
          client_id?: string | null
          created_at?: string
          first_name?: string | null
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
      student_tag: {
        Row: {
          created_at: string
          student_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          student_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          student_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_tag_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_tag_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["id"]
          },
        ]
      }
      tag: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_availability_slots: {
        Args: {
          p_instructor_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          slot_start: string
          slot_end: string
          pattern_id: string
          pattern_name: string
          color: string
        }[]
      }
      get_real_availability: {
        Args: {
          p_instructor_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          slot_start: string
          slot_end: string
          pattern_id: string
          pattern_name: string
          color: string
        }[]
      }
      optimize_availability_patterns: {
        Args: { p_instructor_id: string }
        Returns: undefined
      }
    }
    Enums: {
      AvailabilityStatus: "ACTIVE" | "INACTIVE" | "EXCEPTION"
      BookingStatus:
        | "INTERESTED"
        | "SCHEDULED"
        | "BOOKED"
        | "COMPLETED"
        | "CANCELLED"
        | "IGNORED"
      PaymentStatus: "PENDING" | "DEPOSIT" | "PAID" | "REFUNDED"
      RecurrenceType:
        | "NONE"
        | "DAILY"
        | "WEEKLY"
        | "MONTHLY"
        | "WEEKDAYS"
        | "WEEKENDS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      AvailabilityStatus: ["ACTIVE", "INACTIVE", "EXCEPTION"],
      BookingStatus: [
        "INTERESTED",
        "SCHEDULED",
        "BOOKED",
        "COMPLETED",
        "CANCELLED",
        "IGNORED",
      ],
      PaymentStatus: ["PENDING", "DEPOSIT", "PAID", "REFUNDED"],
      RecurrenceType: [
        "NONE",
        "DAILY",
        "WEEKLY",
        "MONTHLY",
        "WEEKDAYS",
        "WEEKENDS",
      ],
    },
  },
} as const
