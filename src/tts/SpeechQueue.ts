/**
 * NEXUS AI OS — Dedicated Text-to-Speech SpeechQueue
 *
 * Manages FIFO utterance queuing, sequential speech synthesis, and immediate audio cancellation.
 */

import { VoiceOptions } from '../types/voice';

// ─── Debug logger ───────────────────────────────────────────────────────────
const TAG = '[NEXUS/SpeechQueue]';
const log = (...args: any[]) => console.log(TAG, ...args);
const warn = (...args: any[]) => console.warn(TAG, ...args);
const err = (...args: any[]) => console.error(TAG, ...args);
// ────────────────────────────────────────────────────────────────────────────

export type SpeechQueueListener = (isSpeaking: boolean, queueCount: number) => void;

interface QueueItem {
  id: string;
  text: string;
  options?: VoiceOptions;
}

export class SpeechQueue {
  private queue: QueueItem[] = [];
  private isSpeakingActive = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<SpeechQueueListener> = new Set();
  private defaultOptions: VoiceOptions = {
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Add text to speech queue
   */
  public enqueue(text: string, options?: VoiceOptions): string {
    log('enqueue() called — raw text length:', text.length);
    const cleanText = text
      .replace(/\*\*.*?\*\*/g, (m) => m.slice(2, -2))
      .replace(/`.*?`/g, (m) => m.slice(1, -1))
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[#*_~]/g, '')
      .trim();

    if (!cleanText) {
      warn('enqueue() — text is empty after cleaning; skipping');
      return '';
    }

    const id = `tts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    this.queue.push({ id, text: cleanText, options });
    log('enqueue() — queued item', id, '| queue length now:', this.queue.length);

    if (!this.isSpeakingActive) {
      log('enqueue() — not currently speaking; starting processQueue()');
      this.processQueue();
    } else {
      log('enqueue() — already speaking; item added to queue, notifying');
      this.notify();
    }

    return id;
  }

  /**
   * Immediately cancel active speech and flush all queued items.
   * Resets speaking state and notifies subscribers instantly.
   */
  public cancel(): void {
    log('cancel() called — flushing queue (length:', this.queue.length, ') and stopping active speech');
    this.queue = [];
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
        log('cancel() — window.speechSynthesis.cancel() called');
      } catch (cancelErr: any) {
        warn('cancel() — speechSynthesis.cancel() threw:', cancelErr?.message);
      }
    } else {
      warn('cancel() — speechSynthesis not supported; nothing to cancel');
    }
    this.currentUtterance = null;
    this.isSpeakingActive = false;
    this.notify();
    log('cancel() — done; state reset to idle');
  }

  /**
   * Get current speaking state and queue count
   */
  public getStatus() {
    return {
      isSpeaking: this.isSpeakingActive,
      queueCount: this.queue.length,
    };
  }

  /**
   * Subscribe to queue status changes
   */
  public subscribe(listener: SpeechQueueListener): () => void {
    this.listeners.add(listener);
    listener(this.isSpeakingActive, this.queue.length);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setOptions(options: Partial<VoiceOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Process next utterance in queue
   */
  private processQueue(): void {
    log('processQueue() — queue length:', this.queue.length, '| isSpeakingActive:', this.isSpeakingActive);

    if (this.queue.length === 0) {
      log('processQueue() — queue empty; setting idle');
      this.isSpeakingActive = false;
      this.currentUtterance = null;
      this.notify();
      return;
    }

    if (!this.isSupported()) {
      warn('processQueue() — speechSynthesis not supported; clearing queue');
      this.queue = [];
      this.isSpeakingActive = false;
      this.notify();
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeakingActive = true;
    this.notify();

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(item.text);
      const opts = { ...this.defaultOptions, ...item.options };

      utterance.lang = opts.lang || 'en-US';
      utterance.rate = opts.rate ?? 1.0;
      utterance.pitch = opts.pitch ?? 1.0;
      utterance.volume = opts.volume ?? 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (opts.voiceName) {
        const selected = voices.find((v) => v.name.includes(opts.voiceName!));
        if (selected) utterance.voice = selected;
      } else {
        const preferred = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('David'))
        );
        if (preferred) utterance.voice = preferred;
      }

      utterance.onend = () => {
        log('utterance.onend — finished speaking item, processing next in queue');
        this.currentUtterance = null;
        this.processQueue();
      };

      utterance.onerror = (utterErr: any) => {
        err('utterance.onerror — TTS error:', utterErr?.error, utterErr?.message);
        this.currentUtterance = null;
        this.processQueue();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (speakErr: any) {
      err('processQueue() — speechSynthesis.speak() threw:', speakErr?.message);
      err('Stack:', speakErr?.stack);
      this.currentUtterance = null;
      this.processQueue();
    }
  }

  /**
   * Full cleanup of SpeechQueue
   */
  public dispose(): void {
    log('dispose() called — cancelling and clearing listeners');
    this.cancel();
    this.listeners.clear();
    log('dispose() — complete');
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.isSpeakingActive, this.queue.length));
  }
}
