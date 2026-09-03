/**
 * NEXUS AI OS — Supabase Service Layer
 *
 * Centralized CRUD operations for all database tables.
 * Each domain (messages, memory, tasks, preferences) has typed functions
 * that map between the app's TypeScript types and the Supabase schema.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ChatMessage, MemoryEntry, TaskItem, UserPreferences } from '../types/assistant';
import type { Database } from '../types/database';

type DbChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type DbChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
type DbMemoryEntry = Database['public']['Tables']['memory_entries']['Row'];
type DbMemoryEntryInsert = Database['public']['Tables']['memory_entries']['Insert'];
type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbTaskInsert = Database['public']['Tables']['tasks']['Insert'];
type DbTaskUpdate = Database['public']['Tables']['tasks']['Update'];
type DbPreferences = Database['public']['Tables']['user_preferences']['Row'];
type DbPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];

// ============================================================
// MAPPERS: DB Row → App Type
// ============================================================

function mapDbMessageToApp(row: DbChatMessage): ChatMessage {
  return {
    id: row.id,
    sender: row.sender,
    content: row.content,
    timestamp: row.timestamp,
    codeSnippet: row.code_snippet ?? undefined,
    actionCard: row.action_card ?? undefined,
    toolExecutionCard: row.tool_execution_card ?? undefined,
  };
}

function mapDbMemoryToApp(row: DbMemoryEntry): MemoryEntry {
  return {
    id: row.id,
    category: row.category,
    key: row.key,
    value: row.value,
    confidence: row.confidence,
    updatedAt: row.updated_at,
  };
}

function mapDbTaskToApp(row: DbTask): TaskItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at_label,
  };
}

function mapDbPreferencesToApp(row: DbPreferences): UserPreferences {
  return {
    assistantName: row.assistant_name,
    codename: row.codename,
    wakeWord: row.wake_word,
    voiceName: row.voice_name,
    voiceSpeed: row.voice_speed,
    personalityMode: row.personality_mode,
    securityLevel: row.security_level,
    themeAccent: row.theme_accent,
    soundEnabled: row.sound_enabled,
    highContrast: row.high_contrast,
  };
}

// ============================================================
// CHAT MESSAGES
// ============================================================

export async function fetchMessages(): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[NEXUS/Supabase] Failed to fetch messages:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbMessageToApp);
}

export async function insertMessage(msg: ChatMessage): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const row: DbChatMessageInsert = {
    id: msg.id,
    sender: msg.sender,
    content: msg.content,
    timestamp: msg.timestamp,
    code_snippet: msg.codeSnippet ?? null,
    action_card: msg.actionCard ?? null,
    tool_execution_card: msg.toolExecutionCard ?? null,
  };

  const { error } = await supabase.from('chat_messages').insert(row);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to insert message:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// MEMORY ENTRIES
// ============================================================

export async function fetchMemories(): Promise<MemoryEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('memory_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[NEXUS/Supabase] Failed to fetch memories:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbMemoryToApp);
}

export async function insertMemory(entry: MemoryEntry): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const row: DbMemoryEntryInsert = {
    id: entry.id,
    category: entry.category,
    key: entry.key,
    value: entry.value,
    confidence: entry.confidence,
    updated_at: entry.updatedAt,
  };

  const { error } = await supabase.from('memory_entries').insert(row);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to insert memory:', error.message);
    return false;
  }
  return true;
}

export async function deleteMemory(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from('memory_entries').delete().eq('id', id);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to delete memory:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// TASKS
// ============================================================

export async function fetchTasks(): Promise<TaskItem[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[NEXUS/Supabase] Failed to fetch tasks:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbTaskToApp);
}

export async function insertTask(task: TaskItem): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const row: DbTaskInsert = {
    id: task.id,
    title: task.title,
    category: task.category,
    status: task.status,
    priority: task.priority,
    created_at_label: task.createdAt,
  };

  const { error } = await supabase.from('tasks').insert(row);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to insert task:', error.message);
    return false;
  }
  return true;
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<TaskItem, 'title' | 'category' | 'status' | 'priority'>>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const dbUpdates: DbTaskUpdate = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to update task:', error.message);
    return false;
  }
  return true;
}

export async function deleteTask(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to delete task:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// USER PREFERENCES (Singleton "default" row)
// ============================================================

export async function fetchPreferences(): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    console.error('[NEXUS/Supabase] Failed to fetch preferences:', error.message);
    return null;
  }

  return data ? mapDbPreferencesToApp(data) : null;
}

export async function upsertPreferences(prefs: UserPreferences): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const row: DbPreferencesInsert = {
    id: 'default',
    assistant_name: prefs.assistantName,
    codename: prefs.codename,
    wake_word: prefs.wakeWord,
    voice_name: prefs.voiceName,
    voice_speed: prefs.voiceSpeed,
    personality_mode: prefs.personalityMode,
    security_level: prefs.securityLevel,
    theme_accent: prefs.themeAccent,
    sound_enabled: prefs.soundEnabled,
    high_contrast: prefs.highContrast,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_preferences').upsert(row);

  if (error) {
    console.error('[NEXUS/Supabase] Failed to upsert preferences:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// CONNECTION HEALTH CHECK
// ============================================================

export async function checkConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[NEXUS/Supabase] Not configured — skipping connection check.');
    return false;
  }

  try {
    const { error } = await supabase.from('user_preferences').select('id').limit(1);
    if (error) {
      console.error('[NEXUS/Supabase] Connection check failed:', error.message);
      return false;
    }
    console.log('[NEXUS/Supabase] ✅ Connection established successfully.');
    return true;
  } catch (err) {
    console.error('[NEXUS/Supabase] Connection check exception:', err);
    return false;
  }
}
