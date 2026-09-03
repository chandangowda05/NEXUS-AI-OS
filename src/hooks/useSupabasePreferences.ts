/**
 * NEXUS AI OS — Supabase User Preferences Hook
 *
 * Provides persistent preferences state backed by Supabase.
 * Falls back to in-memory defaults if Supabase is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '../types/assistant';
import {
  fetchPreferences,
  upsertPreferences,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_PREFERENCES: UserPreferences = {
  assistantName: 'NEXUS',
  codename: 'Project Phoenix',
  wakeWord: 'Hey Nexus',
  voiceName: 'Holographic Deep Natural',
  voiceSpeed: 1.0,
  personalityMode: 'HUMOROUS',
  securityLevel: 'WINDOWS_HELLO',
  themeAccent: 'CYAN',
  soundEnabled: true,
  highContrast: false,
};

interface UseSupabasePreferencesReturn {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  savePrefs: (prefs: UserPreferences) => Promise<boolean>;
  isLoading: boolean;
}

export function useSupabasePreferences(): UseSupabasePreferencesReturn {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    setIsLoading(true);

    fetchPreferences().then((data) => {
      if (cancelled) return;
      if (data) {
        setPrefs(data);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const savePrefs = useCallback(async (newPrefs: UserPreferences): Promise<boolean> => {
    setPrefs(newPrefs);

    // Also persist via Electron API if available
    if (window.electronAPI) {
      window.electronAPI.savePreference('assistantName', newPrefs.assistantName);
      window.electronAPI.savePreference('wakeWord', newPrefs.wakeWord);
    }

    // Persist to Supabase
    return upsertPreferences(newPrefs);
  }, []);

  return { prefs, setPrefs, savePrefs, isLoading };
}
