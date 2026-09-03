/**
 * NEXUS AI OS — Supabase Chat Messages Hook
 *
 * Provides persistent chat message state backed by Supabase.
 * Falls back to in-memory defaults if Supabase is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types/assistant';
import { fetchMessages, insertMessage } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    content:
      '**NEXUS Cognitive Engine Initialized.** Greetings, Sir. All 9 specialized AI agents, system observers, and memory cores are online and operational.',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actionCard: {
      title: 'Project Phoenix Control Center',
      description: 'Multi-Agent orchestrator & telemetry active.',
      type: 'SUCCESS',
      details: 'ONLINE',
    },
  },
];

interface UseSupabaseMessagesReturn {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => Promise<void>;
  isLoading: boolean;
}

export function useSupabaseMessages(): UseSupabaseMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    setIsLoading(true);

    fetchMessages().then((data) => {
      if (cancelled) return;
      if (data.length > 0) {
        setMessages(data);
      }
      // If no data in DB yet, keep the default welcome message
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const addMessage = useCallback(async (msg: ChatMessage) => {
    // Optimistic update — add to local state immediately
    setMessages((prev) => [...prev, msg]);

    // Persist to Supabase in the background
    await insertMessage(msg);
  }, []);

  return { messages, addMessage, isLoading };
}
