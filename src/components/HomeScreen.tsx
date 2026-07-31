/**
 * NEXUS AI Operating System
 * HomeScreen — AI Companion Living Entry Dashboard
 *
 * Vertically centered conversation-first experience inspired by ChatGPT, VisionOS, Iron Man HUD.
 * Layout Flow:
 *  1. Minimal Header Greeting ("Good Evening, Chandu." + "I'm ready whenever you are.")
 *  2. Centerpiece 400px NEXUS Cognitive Core
 *  3. Modern ChatGPT-style Prompt Bar ("What would you like to do today?") + 4 Pills
 *  4. ONLY 4 Large Glass Quick Action Launcher Cards
 *  5. Morning Briefing & Activity Matrix (Time, Weather, Battery, Calendar, Coding Goal, Memory, LeetCode, Git)
 */

import React, { useState, useEffect } from 'react';
import {
  Code2,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
  Clock,
  Zap,
  Coffee,
  Send,
  Mic,
  BatteryCharging,
  Calendar,
  Brain,
  TrendingUp,
  FolderGit2,
} from 'lucide-react';
import { CognitiveCore } from './CognitiveCore';
import { CognitiveCoreState } from '../types/assistant';
import { Sound } from '../utils/soundEffects';

interface HomeScreenProps {
  isStartingUp?: boolean;
  aiStatus: CognitiveCoreState;
  micActive: boolean;
  transcript?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  onCoreClick: () => void;
  onStateSelect?: (s: CognitiveCoreState) => void;
  onQuickAction: (command: string) => void;
  onOpenChat: () => void;
}

// STRICTLY FOUR LARGE QUICK ACTION CARDS AS REQUESTED
const QUICK_ACTIONS = [
  {
    id: 'project-phoenix',
    title: 'Continue Project Phoenix',
    subtitle: 'Resume NEXUS AI OS development',
    icon: Zap,
    command: 'Continue working on Project Phoenix',
    color: '#00f0ff',
    glow: 'rgba(0, 240, 255, 0.3)',
    border: 'rgba(0, 240, 255, 0.35)',
  },
  {
    id: 'vscode',
    title: 'Open VS Code',
    subtitle: 'Launch IDE for active project',
    icon: Code2,
    command: 'Launch VS Code',
    color: '#0077ff',
    glow: 'rgba(0, 119, 255, 0.3)',
    border: 'rgba(0, 119, 255, 0.35)',
  },
  {
    id: 'study',
    title: 'Study Mode',
    subtitle: 'DSA, System Design & Placement',
    icon: BookOpen,
    command: 'Study DSA roadmap',
    color: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.3)',
    border: 'rgba(168, 85, 247, 0.35)',
  },
  {
    id: 'briefing',
    title: 'Morning Briefing',
    subtitle: 'Goals, schedule & AI summary',
    icon: Coffee,
    command: 'Run morning briefing',
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.3)',
    border: 'rgba(249, 115, 22, 0.35)',
  },
];

const SUGGESTION_PILLS = [
  'Continue Project Phoenix',
  'Open VS Code',
  'Explain Java Threads',
  'Summarize today\'s tasks',
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  isStartingUp,
  aiStatus,
  micActive: _micActive,
  transcript,
  isSpeaking,
  isListening,
  onCoreClick,
  onStateSelect,
  onQuickAction,
  onOpenChat: _onOpenChat,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('Good Evening');
  const [greetingIcon, setGreetingIcon] = useState<'morning' | 'afternoon' | 'evening'>('evening');
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
      const hr = now.getHours();
      if (hr < 12) {
        setGreeting('Good Morning');
        setGreetingIcon('morning');
      } else if (hr < 17) {
        setGreeting('Good Afternoon');
        setGreetingIcon('afternoon');
      } else {
        setGreeting('Good Evening');
        setGreetingIcon('evening');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (transcript) {
      setPromptText(transcript);
    }
  }, [transcript]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    const cmd = promptText.trim();
    setPromptText('');
    Sound.playListen();
    onQuickAction(cmd);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-4xl flex flex-col items-center space-y-7 my-auto">

        {/* ── SECTION 1: GREETING HEADER ── */}
        {!isStartingUp && (
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)' }}
              >
                {greetingIcon === 'morning' && <Sun className="w-5.5 h-5.5 text-amber-400" />}
                {greetingIcon === 'afternoon' && <CloudSun className="w-5.5 h-5.5 text-amber-300" />}
                {greetingIcon === 'evening' && <Moon className="w-5.5 h-5.5 text-cyan-400" />}
              </div>
            </div>

            <h1
              className="font-display font-black text-4xl md:text-5xl text-slate-100 tracking-tight"
              style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.25)' }}
            >
              {greeting}, Chandu.
            </h1>
            <p className="text-slate-400 text-base md:text-lg font-light tracking-wide">
              I&apos;m ready whenever you are.
            </p>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/70 border border-slate-900 text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">{timeStr}</span>
              <span>·</span>
              <span>{dateStr}</span>
            </div>
          </div>
        )}

        {/* ── SECTION 2: 400PX COGNITIVE CORE CENTERPIECE ── */}
        <div className="flex flex-col items-center justify-center py-1 shrink-0 space-y-2">
          <CognitiveCore
            state={aiStatus}
            micActive={_micActive}
            transcript={transcript}
            isSpeaking={isSpeaking}
            onCoreClick={onCoreClick}
            onStateSelect={onStateSelect}
          />
          {isListening && (
            <div className="px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs animate-pulse flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>{transcript ? `"${transcript}"` : 'Listening... Speak your command'}</span>
            </div>
          )}
        </div>

        {/* ── SECTION 3: CONVERSATION INPUT (ChatGPT-Style AI Prompt Box) ── */}
        <div className="w-full max-w-2xl space-y-3">
          <form
            onSubmit={handlePromptSubmit}
            className="relative flex items-center rounded-2xl glass-panel p-2 border-cyan-500/30 focus-within:border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all"
          >
            <div className="pl-3 pr-2 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="What would you like to do today?"
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-400 text-sm focus:outline-none py-2 font-sans tracking-wide"
            />
            <button
              type="button"
              onClick={() => { console.log('🔥 [NEXUS/UI] Microphone button clicked (HomeScreen prompt bar mic button)'); Sound.playListen(); onCoreClick(); }}
              title="Voice Input"
              className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all cursor-pointer"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
            <button
              type="submit"
              disabled={!promptText.trim()}
              title="Send Command"
              className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 transition-all cursor-pointer ml-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Prompt Suggestion Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTION_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  Sound.playListen();
                  onQuickAction(pill);
                }}
                className="px-3 py-1 rounded-full bg-slate-950/60 border border-slate-900 text-[11px] font-mono text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer"
              >
                + {pill}
              </button>
            ))}
          </div>
        </div>

        {/* ── SECTION 4: QUICK ACTION CARDS (EXACTLY 4 LARGE CARDS) ── */}
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {QUICK_ACTIONS.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    Sound.playNotification();
                    onQuickAction(act.command);
                  }}
                  className="group p-4 rounded-2xl text-left transition-all duration-300 flex flex-col gap-3 cursor-pointer"
                  style={{
                    background: 'rgba(8, 12, 26, 0.75)',
                    border: `1px solid ${act.border}`,
                    backdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 35px ${act.glow}`;
                    (e.currentTarget as HTMLElement).style.borderColor = act.color;
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.borderColor = act.border;
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ background: act.color + '18', border: `1px solid ${act.color}40` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: act.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors leading-tight">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                      {act.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SECTION 5: MORNING BRIEFING & RECENT ACTIVITY MATRIX ── */}
        <div className="w-full space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
              Today&apos;s Briefing & Telemetry
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {/* Weather */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Weather</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-lg font-display font-bold text-slate-100">24°C</span>
              <span className="text-[11px] text-slate-400 truncate">Clear skies, Bengaluru</span>
            </div>

            {/* Battery */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Battery</span>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-lg font-display font-bold text-emerald-300">94%</span>
              <span className="text-[11px] text-slate-400 truncate">Connected to AC</span>
            </div>

            {/* Coding Progress */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Coding Goal</span>
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-lg font-display font-bold text-cyan-300">84%</span>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '84%' }} />
              </div>
            </div>

            {/* Schedule / Calendar */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Calendar</span>
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-bold text-slate-100 truncate">3 events today</span>
              <span className="text-[11px] text-slate-400 truncate">Next: Sync @ 2:00 PM</span>
            </div>

            {/* Current Project */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Active Project</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-sm font-bold text-slate-100 truncate">Project Phoenix</span>
              <span className="text-[11px] text-cyan-400 truncate">NEXUS AI OS v1.0</span>
            </div>

            {/* Recent Memory */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Memory core</span>
                <Brain className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-bold text-slate-100 truncate">Indexed 42 facts</span>
              <span className="text-[11px] text-slate-400 truncate">SQLite store active</span>
            </div>

            {/* LeetCode Progress */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>LeetCode</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-sm font-bold text-amber-300 truncate">412 Solved</span>
              <span className="text-[11px] text-slate-400 truncate">Global Rank #14,200</span>
            </div>

            {/* Git Activity */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-900 flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono uppercase font-bold">
                <span>Git activity</span>
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-emerald-300 truncate">12 commits today</span>
              <span className="text-[11px] text-slate-400 truncate">3 active branches</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeScreen;
