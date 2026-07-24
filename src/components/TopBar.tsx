/**
 * NEXUS AI Operating System
 * TopBar Component — Minimal AI Status Control Header
 *
 * Displays strictly:
 *  - NEXUS title & version badge
 *  - AI Status (9 states badge)
 *  - Current Model ("Gemini 3.6 Flash")
 *  - Current Time
 *  - Internet connection status
 *  - Microphone toggle
 *  - Notification trigger
 *  - User Avatar ("Chandu")
 *  - Slide-in Right Sidebar toggle
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';
import { SystemMetrics, CognitiveCoreState } from '../types/assistant';
import { Sound } from '../utils/soundEffects';

interface TopBarProps {
  metrics: SystemMetrics;
  onToggleMic: () => void;
  onToggleSound: () => void;
  onToggleHighContrast: () => void;
  onToggleRightSidebar: () => void;
}

const STATE_STYLES: Record<
  CognitiveCoreState,
  { border: string; text: string; bg: string; shadow: string }
> = {
  IDLE: {
    border: 'rgba(0, 240, 255, 0.4)',
    text: '#00f0ff',
    bg: 'rgba(0, 240, 255, 0.08)',
    shadow: '0 0 10px rgba(0, 240, 255, 0.25)',
  },
  LISTENING: {
    border: 'rgba(0, 119, 255, 0.4)',
    text: '#0077ff',
    bg: 'rgba(0, 119, 255, 0.08)',
    shadow: '0 0 10px rgba(0, 119, 255, 0.25)',
  },
  THINKING: {
    border: 'rgba(168, 85, 247, 0.4)',
    text: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.08)',
    shadow: '0 0 10px rgba(168, 85, 247, 0.25)',
  },
  PLANNING: {
    border: 'rgba(249, 115, 22, 0.4)',
    text: '#f97316',
    bg: 'rgba(249, 115, 22, 0.08)',
    shadow: '0 0 10px rgba(249, 115, 22, 0.25)',
  },
  SEARCHING: {
    border: 'rgba(6, 182, 212, 0.4)',
    text: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.08)',
    shadow: '0 0 10px rgba(6, 182, 212, 0.25)',
  },
  EXECUTING: {
    border: 'rgba(239, 68, 68, 0.4)',
    text: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    shadow: '0 0 10px rgba(239, 68, 68, 0.25)',
  },
  LEARNING: {
    border: 'rgba(16, 185, 129, 0.4)',
    text: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    shadow: '0 0 10px rgba(16, 185, 129, 0.25)',
  },
  OFFLINE: {
    border: 'rgba(148, 163, 184, 0.3)',
    text: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.05)',
    shadow: 'none',
  },
  ERROR: {
    border: 'rgba(244, 63, 94, 0.4)',
    text: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.08)',
    shadow: '0 0 10px rgba(244, 63, 94, 0.25)',
  },
};

export const TopBar: React.FC<TopBarProps> = ({
  metrics,
  onToggleMic,
  onToggleSound,
  onToggleHighContrast: _onToggleHighContrast,
  onToggleRightSidebar,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const activeStyle = STATE_STYLES[metrics.aiStatus] ?? STATE_STYLES.IDLE;

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      role="banner"
      aria-label="NEXUS AI Control Bar"
      className="h-14 px-4 glass-panel flex items-center justify-between z-20 m-3 mb-0 rounded-2xl border-cyan-500/20 shrink-0 select-none"
    >
      {/* 1. Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center animate-holo-pulse"
          style={{
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
          }}
          aria-hidden="true"
        >
          <Zap className="w-4.5 h-4.5 text-cyan-400" />
        </div>

        <div className="flex items-center gap-2">
          <h1 className="font-display font-black text-base tracking-wider text-slate-100">
            {import.meta.env.VITE_ASSISTANT_NAME ?? 'NEXUS'}
          </h1>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            v1.0
          </span>
        </div>
      </div>

      {/* 2. Center: Minimal AI Status + Active Model ID + Current Time */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* AI Status Badge */}
        <div
          role="status"
          aria-label={`Cognitive State: ${metrics.aiStatus}`}
          className="px-3.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300"
          style={{
            borderColor: activeStyle.border,
            color: activeStyle.text,
            background: activeStyle.bg,
            boxShadow: activeStyle.shadow,
          }}
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          <span>{metrics.aiStatus}</span>
        </div>

        {/* Current AI Model */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-900 text-slate-300 text-[11px]">
          <span className="text-slate-500">MODEL:</span>
          <span className="text-cyan-300 font-bold">Gemini 3.6 Flash</span>
        </div>

        {/* Live Current Time */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-900 text-slate-300 text-[11px]">
          <span className="text-cyan-400 font-bold">{timeStr}</span>
        </div>
      </div>

      {/* 3. Right: Internet, Mic, Notification, Avatar, Drawer Trigger */}
      <div className="flex items-center gap-2.5 text-xs font-mono">
        {/* Internet Status */}
        <div
          title={metrics.networkOnline ? 'Internet Connected (14ms latency)' : 'Offline Mode'}
          className="p-2 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-400 flex items-center justify-center"
        >
          {metrics.networkOnline ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400" />
          )}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            Sound.playNotification();
            onToggleSound();
          }}
          title={metrics.soundEnabled ? 'Mute Synthesizer Sounds' : 'Unmute Synthesizer Sounds'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            metrics.soundEnabled
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-slate-950/60 border-slate-900 text-slate-500'
          }`}
        >
          {metrics.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Microphone Toggle */}
        <button
          onClick={() => {
            Sound.playListen();
            onToggleMic();
          }}
          aria-pressed={metrics.micActive}
          aria-label={metrics.micActive ? 'Deactivate microphone' : 'Activate microphone'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            metrics.micActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
              : 'bg-slate-950/60 border-slate-900 text-slate-500'
          }`}
        >
          {metrics.micActive ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => {
            Sound.playNotification();
            onToggleRightSidebar();
          }}
          title="Notifications & Telemetry Drawer"
          className="p-2 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-pointer relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>

        {/* Slide-In Right Telemetry Drawer Toggle */}
        <button
          onClick={() => {
            Sound.playStateShift();
            onToggleRightSidebar();
          }}
          title="Toggle Hardware & Telemetry Matrix"
          className="p-2 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div
          title="Chandu (Owner)"
          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/40 flex items-center justify-center text-white font-bold text-xs shadow-md"
        >
          C
        </div>
      </div>
    </header>
  );
};

export default TopBar;
