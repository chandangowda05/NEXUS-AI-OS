/**
 * NEXUS AI OS — Supabase Tasks Hook
 *
 * Provides persistent task state backed by Supabase.
 * Falls back to in-memory defaults if Supabase is unavailable.
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskItem } from '../types/assistant';
import {
  fetchTasks,
  insertTask,
  updateTask as updateTaskApi,
  deleteTask as deleteTaskApi,
} from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Initialize Core Voice & NLP Brain Pipeline',
    category: 'SYSTEM',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    createdAt: 'Today, 19:00',
  },
  {
    id: 'task-2',
    title: 'Configure Windows Native System Controls',
    category: 'SYSTEM',
    status: 'PENDING',
    priority: 'HIGH',
    createdAt: 'Today, 19:15',
  },
  {
    id: 'task-3',
    title: 'Review System Design - Scalable Microservices & Kafka',
    category: 'STUDY',
    status: 'PENDING',
    priority: 'MEDIUM',
    createdAt: 'Yesterday',
  },
  {
    id: 'task-4',
    title: 'Setup SQLite Vector Embeddings Table',
    category: 'CODING',
    status: 'COMPLETED',
    priority: 'HIGH',
    createdAt: 'Today, 18:30',
  },
];

interface UseSupabaseTasksReturn {
  tasks: TaskItem[];
  addTask: (task: TaskItem) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  isLoading: boolean;
}

export function useSupabaseTasks(): UseSupabaseTasksReturn {
  const [tasks, setTasks] = useState<TaskItem[]>(DEFAULT_TASKS);
  const [isLoading, setIsLoading] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;
    setIsLoading(true);

    fetchTasks().then((data) => {
      if (cancelled) return;
      if (data.length > 0) {
        setTasks(data);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const addTask = useCallback(async (task: TaskItem) => {
    setTasks((prev) => [task, ...prev]);
    await insertTask(task);
  }, []);

  const toggleTaskStatus = useCallback(async (id: string) => {
    let newStatus: TaskItem['status'] = 'PENDING';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          newStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...t, status: newStatus };
        }
        return t;
      })
    );

    await updateTaskApi(id, { status: newStatus });
  }, []);

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskApi(id);
  }, []);

  return { tasks, addTask, toggleTaskStatus, removeTask, isLoading };
}
