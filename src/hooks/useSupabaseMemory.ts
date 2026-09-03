/**
 * NEXUS AI OS — Supabase Memory Entries Hook
 *
 * Provides persistent memory state backed by Supabase.
 * Falls back to in-memory defaults if Supabase is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { MemoryEntry } from '../types/assistant';
import {
  fetchMemories,
  insertMemory,
  deleteMemory as deleteMemoryApi,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_MEMORIES: MemoryEntry[] = [
  {
    id: 'mem-1',
    category: 'GOAL',
    key: 'Primary Objective',
    value: 'Build world-class AI Assistant (Project Phoenix)',
    confidence: 1.0,
    updatedAt: 'Just now',
  },
  {
    id: 'mem-2',
    category: 'PREFERENCE',
    key: 'UI Aesthetic',
    value: 'Obsidian dark, cyan glowing glassmorphic interface with blue holographic orb',
    confidence: 0.98,
    updatedAt: 'Today, 19:30',
  },
  {
    id: 'mem-3',
    category: 'PROJECT',
    key: 'Active Repository',
    value: 'g:/jarvis (Electron + React + TypeScript + SQLite)',
    confidence: 1.0,
    updatedAt: 'Today, 19:32',
  },
  {
    id: 'mem-4',
    category: 'HABIT',
    key: 'Coding Language Preference',
    value: 'TypeScript, Python, Java, System Design, DSA',
    confidence: 0.95,
    updatedAt: 'Yesterday',
  },
];

interface UseSupabaseMemoryReturn {
  memories: MemoryEntry[];
  addMemory: (entry: MemoryEntry) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useSupabaseMemory(): UseSupabaseMemoryReturn {
  const [memories, setMemories] = useState<MemoryEntry[]>(DEFAULT_MEMORIES);
  const [isLoading, setIsLoading] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    setIsLoading(true);

    fetchMemories().then((data) => {
      if (cancelled) return;
      if (data.length > 0) {
        setMemories(data);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const addMemory = useCallback(async (entry: MemoryEntry) => {
    // Optimistic update
    setMemories((prev) => [entry, ...prev]);
    await insertMemory(entry);
  }, []);

  const removeMemory = useCallback(async (id: string) => {
    // Optimistic update
    setMemories((prev) => prev.filter((m) => m.id !== id));
    await deleteMemoryApi(id);
  }, []);

  return { memories, addMemory, removeMemory, isLoading };
}
