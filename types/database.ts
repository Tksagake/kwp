export interface Database {
  public: {
    Tables: {
      waste_pickers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          reg_id: string
          mobile_number: string
          county: string
          email: string
          id_number: string
          profile_image?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          reg_id: string
          mobile_number: string
          county: string
          email: string
          id_number: string
          profile_image?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          reg_id?: string
          mobile_number?: string
          county?: string
          email?: string
          id_number?: string
          profile_image?: string
          updated_at?: string
        }
      }
      county_managers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          username: string
          mobile_number: string
          county: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          username: string
          mobile_number: string
          county: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          username?: string
          mobile_number?: string
          county?: string
          email?: string
          updated_at?: string
        }
      }
      counties: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          updated_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          member_id: string
          amount: number
          date: string
          type: 'Monthly' | 'Donation' | 'Other'
          description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          amount: number
          date: string
          type: 'Monthly' | 'Donation' | 'Other'
          description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          amount?: number
          date?: string
          type?: 'Monthly' | 'Donation' | 'Other'
          description?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          recipient_type: 'waste_picker' | 'county_manager' | 'all_waste_pickers' | 'all_managers'
          recipient_id?: string
          sent_at: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          recipient_type: 'waste_picker' | 'county_manager' | 'all_waste_pickers' | 'all_managers'
          recipient_id?: string
          sent_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          recipient_type?: 'waste_picker' | 'county_manager' | 'all_waste_pickers' | 'all_managers'
          recipient_id?: string
          sent_at?: string
        }
      }
    }
  }
}