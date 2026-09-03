/**
 * NEXUS AI OS — Supabase Database Type Definitions
 *
 * Auto-generated-style typed definitions that match the SQL migration schema.
 * Provides Row, Insert, and Update types for type-safe Supabase queries.
 */

export interface Database {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          id: string;
          sender: 'user' | 'assistant' | 'system';
          content: string;
          timestamp: string;
          code_snippet: { language: string; code: string } | null;
          action_card: {
            title: string;
            description: string;
            type: 'SUCCESS' | 'INFO' | 'WARNING' | 'EXECUTION';
            details?: string;
          } | null;
          tool_execution_card: {
            toolName: string;
            status: 'RUNNING' | 'SUCCESS' | 'FAILED';
            progressPercent: number;
            logOutput: string;
          } | null;
          created_at: string;
        };
        Insert: {
          id: string;
          sender: 'user' | 'assistant' | 'system';
          content: string;
          timestamp: string;
          code_snippet?: { language: string; code: string } | null;
          action_card?: {
            title: string;
            description: string;
            type: 'SUCCESS' | 'INFO' | 'WARNING' | 'EXECUTION';
            details?: string;
          } | null;
          tool_execution_card?: {
            toolName: string;
            status: 'RUNNING' | 'SUCCESS' | 'FAILED';
            progressPercent: number;
            logOutput: string;
          } | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender?: 'user' | 'assistant' | 'system';
          content?: string;
          timestamp?: string;
          code_snippet?: { language: string; code: string } | null;
          action_card?: {
            title: string;
            description: string;
            type: 'SUCCESS' | 'INFO' | 'WARNING' | 'EXECUTION';
            details?: string;
          } | null;
          tool_execution_card?: {
            toolName: string;
            status: 'RUNNING' | 'SUCCESS' | 'FAILED';
            progressPercent: number;
            logOutput: string;
          } | null;
          created_at?: string;
        };
        Relationships: [];
      };

      memory_entries: {
        Row: {
          id: string;
          category: 'PREFERENCE' | 'PROJECT' | 'GOAL' | 'HABIT' | 'FACT';
          key: string;
          value: string;
          confidence: number;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          category: 'PREFERENCE' | 'PROJECT' | 'GOAL' | 'HABIT' | 'FACT';
          key: string;
          value: string;
          confidence?: number;
          updated_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: 'PREFERENCE' | 'PROJECT' | 'GOAL' | 'HABIT' | 'FACT';
          key?: string;
          value?: string;
          confidence?: number;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      tasks: {
        Row: {
          id: string;
          title: string;
          category: 'SYSTEM' | 'STUDY' | 'CODING' | 'PERSONAL';
          status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          priority: 'HIGH' | 'MEDIUM' | 'LOW';
          created_at_label: string;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          category: 'SYSTEM' | 'STUDY' | 'CODING' | 'PERSONAL';
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          priority?: 'HIGH' | 'MEDIUM' | 'LOW';
          created_at_label: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: 'SYSTEM' | 'STUDY' | 'CODING' | 'PERSONAL';
          status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
          priority?: 'HIGH' | 'MEDIUM' | 'LOW';
          created_at_label?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      user_preferences: {
        Row: {
          id: string;
          assistant_name: string;
          codename: string;
          wake_word: string;
          voice_name: string;
          voice_speed: number;
          personality_mode: 'PROFESSIONAL' | 'HUMOROUS' | 'CONCISE' | 'TEACHER';
          security_level: 'PIN' | 'PASSWORD' | 'WINDOWS_HELLO' | 'NONE';
          theme_accent: 'CYAN' | 'PURPLE' | 'EMERALD' | 'SAPPHIRE';
          sound_enabled: boolean;
          high_contrast: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assistant_name?: string;
          codename?: string;
          wake_word?: string;
          voice_name?: string;
          voice_speed?: number;
          personality_mode?: 'PROFESSIONAL' | 'HUMOROUS' | 'CONCISE' | 'TEACHER';
          security_level?: 'PIN' | 'PASSWORD' | 'WINDOWS_HELLO' | 'NONE';
          theme_accent?: 'CYAN' | 'PURPLE' | 'EMERALD' | 'SAPPHIRE';
          sound_enabled?: boolean;
          high_contrast?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assistant_name?: string;
          codename?: string;
          wake_word?: string;
          voice_name?: string;
          voice_speed?: number;
          personality_mode?: 'PROFESSIONAL' | 'HUMOROUS' | 'CONCISE' | 'TEACHER';
          security_level?: 'PIN' | 'PASSWORD' | 'WINDOWS_HELLO' | 'NONE';
          theme_accent?: 'CYAN' | 'PURPLE' | 'EMERALD' | 'SAPPHIRE';
          sound_enabled?: boolean;
          high_contrast?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
