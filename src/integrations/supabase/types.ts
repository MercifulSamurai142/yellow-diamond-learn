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
      achievements: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          name: string
          language: string
          description: string | null
          url: string | null
          image_url : string | null
          created_at: string | null
          updated_at: string | null
          expire_at: string | null
        }
        Insert: {
          id?: string
          name: string
          language: string
          description?: string | null
          url?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          expire_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          language?: string
          description?: string | null
          url?: string | null
          image_url?: string | null
          created_at?: string | null
          updated_at?: string | null
          expire_at?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          is_correct: boolean
          order: number
          question_id: string | null
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order: number
          question_id?: string | null
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          order?: number
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          module_id: string | null
          order: number
          title: string
          updated_at: string | null
          video_url: string | null
          language: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          module_id?: string | null
          order: number
          title: string
          updated_at?: string | null
          video_url?: string | null
          language?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          module_id?: string | null
          order?: number
          title?: string
          updated_at?: string | null
          video_url?: string | null
          language?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order: number
          updated_at: string | null
          video_url: string | null
          language: string | null
          reference_module_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order: number
          updated_at?: string | null
          video_url?: string | null
          language?: string | null
          reference_module_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order?: number
          updated_at?: string | null
          video_url?: string | null
          language?: string | null
          reference_module_id?: string | null
        }
        Relationships: []
      }
      module_designation: { // New Table
        Row: {
          module_id: string
          designation: string
        }
        Insert: {
          module_id: string
          designation: string
        }
        Update: {
          module_id?: string
          designation?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_designation_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      module_region: { // New Table
        Row: {
          module_id: string
          region: string
        }
        Insert: {
          module_id: string
          region: string
        }
        Update: {
          module_id?: string
          region?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_region_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      module_state: {
        Row: {
          module_id: string
          state: string
        }
        Insert: {
          module_id: string
          state: string
        }
        Update: {
          module_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_state_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
      }
      modules_completed: {
        Row: {
          id: string
          user_id: string
          module_id: string
          completion_date: string
        }
        Insert: {
          id?: string
          user_id: string
          module_id: string
          completion_date?: string
        }
        Update: {
          id?: string
          user_id?: string
          module_id?: string
          completion_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_completed_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_completed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          created_at: string | null
          id: string
          order: number
          question_text: string
          quiz_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order: number
          question_text: string
          quiz_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order?: number
          question_text?: string
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answers_json: Json | null
          created_at: string | null
          id: string
          lesson_id: string | null
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_results_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string | null
          pass_threshold: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_threshold?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pass_threshold?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      region_admin_state: { // Added table
        Row: {
          id: string; // Foreign key to public.users.id
          state: string;
        }
        Insert: {
          id: string;
          state: string;
        }
        Update: {
          id?: string;
          state?: string;
        }
        Relationships: [
          {
            foreignKeyName: "region_admin_state_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      revoked_users: {
        Row: {
          email: string
          name: string | null          
          psl_id: string
          designation: string | null
          region: string | null
          state: string | null
          role: string | null
          timestamp: string | null
        }
        Insert: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
          timestamp?: string | null
        }
        Update: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string | null
          earned_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          achievement_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          lesson_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          lesson_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          profile_picture: string | null
          role: string
          updated_at: string | null
          region: string | null
          psl_id: string | null
          designation: string | null
          state: string | null
          language: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          profile_picture?: string | null
          role?: string
          updated_at?: string | null
          region?: string | null
          psl_id?: string | null
          designation?: string | null
          state?: string | null
          language?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          profile_picture?: string | null
          role?: string
          updated_at?: string | null
          region?: string | null
          psl_id?: string | null
          designation?: string | null
          state?: string | null
          language?: string | null
        }
        Relationships: []
      }
      user_import_staging: {
        Row: {
          email: string
          name: string | null          
          psl_id: string
          designation: string | null
          region: string | null
          state: string | null
          role: string | null
        }
        Insert: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
        }
        Update: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
        }
        Relationships: []
      }
      user_import_staging_test: {
        Row: {
          email: string
          name: string | null          
          psl_id: string
          designation: string | null
          region: string | null
          state: string | null
          role: string | null
        }
        Insert: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
        }
        Update: {
          email?: string | null
          name?: string | null          
          psl_id: string
          designation?: string | null
          region?: string | null
          state?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_quiz_results: {
        Args: { user_id_param: string; quiz_ids_param: string[] }
        Returns: {
          id: string
          user_id: string
          quiz_id: string
          score: number
          passed: boolean
          created_at: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      insert_quiz_result: {
        Args: {
          user_id_input: string
          quiz_id_input: string
          lesson_id_input: string
          score_input: number
          passed_input: boolean
          answers_json_input: Json
        }
        Returns: undefined
      }
      save_quiz_result: {
        Args: {
          user_id_param: string
          quiz_id_param: string
          lesson_id_param: string
          score_param: number
          passed_param: boolean
          answers_json_param: Json
        }
        Returns: undefined
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
    Enums: {},
  },
} as const