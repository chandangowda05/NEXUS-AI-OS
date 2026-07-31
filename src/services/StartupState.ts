/**
 * NEXUS AI OS — StartupState & Reactive Progress Manager
 *
 * Tracks startup task progress, current task label, timing metrics,
 * and completion state without forcing full App re-renders.
 */

import { useState, useEffect } from 'react';

export interface StartupProgressState {
  progress: number; // 0 to 100
  currentTask: string;
  isComplete: boolean;
  durationMs: number | null;
  isFadingOut: boolean;
  isHidden: boolean;
}

type StartupStateListener = (state: StartupProgressState) => void;

class StartupStateManager {
  private state: StartupProgressState = {
    progress: 0,
    currentTask: 'Initializing NEXUS...',
    isComplete: false,
    durationMs: null,
    isFadingOut: false,
    isHidden: false,
  };

  private listeners: Set<StartupStateListener> = new Set();

  public getState(): StartupProgressState {
    return { ...this.state };
  }

  public subscribe(listener: StartupStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Update progress percentage and task label.
   * Enforces monotonic progress (progress percentage never jumps backwards).
   */
  public updateProgress(progress: number, currentTask: string): void {
    const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
    const newProgress = Math.max(this.state.progress, clampedProgress);

    this.state = {
      ...this.state,
      progress: newProgress,
      currentTask: currentTask || this.state.currentTask,
    };
    this.notify();
  }

  /**
   * Mark startup sequence as 100% complete with timing duration.
   */
  public markComplete(durationMs: number): void {
    this.state = {
      ...this.state,
      progress: 100,
      currentTask: 'Ready',
      isComplete: true,
      durationMs,
    };
    this.notify();
  }

  /**
   * Set fade-out transition state.
   */
  public setFadingOut(isFadingOut: boolean): void {
    this.state = {
      ...this.state,
      isFadingOut,
    };
    this.notify();
  }

  /**
   * Set splash screen hidden state.
   */
  public setHidden(isHidden: boolean): void {
    this.state = {
      ...this.state,
      isHidden,
    };
    this.notify();
  }

  /**
   * Reset state for testing environments.
   */
  public resetForTest(): void {
    this.state = {
      progress: 0,
      currentTask: 'Initializing NEXUS...',
      isComplete: false,
      durationMs: null,
      isFadingOut: false,
      isHidden: false,
    };
    this.listeners.clear();
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}

export const StartupState = new StartupStateManager();

/**
 * Custom React hook for observing StartupState reactively.
 */
export function useStartupState(): StartupProgressState {
  const [state, setState] = useState<StartupProgressState>(() => StartupState.getState());

  useEffect(() => {
    return StartupState.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return state;
}

export default StartupState;
