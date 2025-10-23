// src/lib/supabase.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          title: string;
          done: boolean;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          done?: boolean;
          created_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          title?: string;
          done?: boolean;
          created_at?: string;
          user_id?: string;
        };
      };
    };
  };
}
