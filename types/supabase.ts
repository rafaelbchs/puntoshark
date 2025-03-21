export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      cart_items: {
        Row: {
          id: string
          created_at: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          quantity?: number
          price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          created_at: string
          status: string
        }
        Insert: {
          id: string
          created_at?: string
          status: string
        }
        Update: {
          id?: string
          created_at?: string
          status?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Insert: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_function_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          function_schema: string
          function_definition: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

