export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_type: string
          client_id: string | null
          created_at: string
          description: string | null
          end_datetime: string
          id: string
          legal_case_id: string | null
          location: string | null
          notes: string | null
          reminder_sent: boolean | null
          start_datetime: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_datetime: string
          id?: string
          legal_case_id?: string | null
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          start_datetime: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          end_datetime?: string
          id?: string
          legal_case_id?: string | null
          location?: string | null
          notes?: string | null
          reminder_sent?: boolean | null
          start_datetime?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          client_type: string
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          client_type?: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          client_type?: string
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          registration_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          client_id: string | null
          communication_date: string
          communication_type: string
          contact_person: string | null
          content: string | null
          created_at: string
          direction: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          legal_case_id: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          communication_date?: string
          communication_type?: string
          contact_person?: string | null
          content?: string | null
          created_at?: string
          direction: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          legal_case_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          communication_date?: string
          communication_type?: string
          contact_person?: string | null
          content?: string | null
          created_at?: string
          direction?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          legal_case_id?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          created_at: string
          description: string | null
          document_type: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_confidential: boolean | null
          legal_case_id: string | null
          mime_type: string | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          legal_case_id?: string | null
          mime_type?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          legal_case_id?: string | null
          mime_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          legal_case_id: string | null
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          legal_case_id?: string | null
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          legal_case_id?: string | null
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_cases: {
        Row: {
          actual_value: number | null
          case_number: string
          case_type: string
          client_id: string | null
          court_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          estimated_value: number | null
          id: string
          opposing_party: string | null
          priority: string
          start_date: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          case_number: string
          case_type: string
          client_id?: string | null
          court_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_value?: number | null
          id?: string
          opposing_party?: string | null
          priority?: string
          start_date?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_value?: number | null
          case_number?: string
          case_type?: string
          client_id?: string | null
          court_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimated_value?: number | null
          id?: string
          opposing_party?: string | null
          priority?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          legal_case_id: string | null
          priority: string
          reminder_date: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          legal_case_id?: string | null
          priority?: string
          reminder_date?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          legal_case_id?: string | null
          priority?: string
          reminder_date?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
