/**
 * NEXUS AI Operating System
 * RightSidebar Component — Slide-In Telemetry & AI Control Drawer
 *
 * Hidden by default, slides in when requested from top bar.
 * Contains:
 *  - System Metrics (Hardware Matrix: 8 Circular Gauges)
 *  - Running AI Agents
 *  - Current AI Model ("Gemini 3.6 Flash")
 *  - Notifications Center
 *  - Developer Logs (Event Bus Stream)
 *  - Memory Feed Summary
 */

import React, { useState } from 'react';
import {
  Bell,
  Folder,
  Layers,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  X,
  Brain,
  Terminal,
} from 'lucide-react';
import { SystemMetrics } from '../types/assistant';
import { SystemMetricsGauges } from './SystemMetricsGauges';
import { Sound } from '../utils/soundEffects';

interface RightSidebarProps {
  metrics: SystemMetrics;
  isOpen: boolean;
  onClose: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ metrics, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'METRICS' | 'AGENTS' | 'NOTIFS' | 'LOGS'>('METRICS');
  const [agentsCollapsed, setAgentsCollapsed] = useState(false);

  const agents = [
    { name: 'Coordinator Agent', status: 'ACTIVE', color: 'text-cyan-400' },
    { name: 'Planning Agent (DAG)', status: 'STANDBY', color: 'text-purple-400' },
    { name: 'Memory Engine Agent', status: 'INDEXING', color: 'text-emerald-400' },
    { name: 'Coding Assistant Agent', status: 'READY', color: 'text-amber-400' },
    { name: 'Vision OCR Observer', status: 'ACTIVE', color: 'text-blue-400' },
    { name: 'Tool Proxy Manager', status: 'SECURE', color: 'text-cyan-400' },
  ];

  const notifications = [
    { title: 'DAG Sequence Generated', time: '1m ago', type: 'INFO' },
    { title: 'SQLite Fact Index Updated', time: '5m ago', type: 'SUCCESS' },
    { title: 'System Diagnostics Clean', time: '12m ago', type: 'SUCCESS' },
  ];

  const logs = [
    { type: 'IPC', msg: 'Aggregated hardware telemetry', ts: '21:02:10' },
    { type: 'BUS', msg: 'Published COGNITIVE_DECISION event', ts: '21:02:14' },
    { type: 'LLM', msg: 'Active Provider: Gemini 3.6 Flash', ts: '21:02:18' },
  ];

  const memoryFeed = [
    { key: 'Preferred IDE', val: 'VS Code' },
    { key: 'Active Project', val: 'Project Phoenix (NEXUS AI OS)' },
    { key: 'Primary Stack', val: 'TypeScript / React / Electron' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close telemetry drawer"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
      />

      {/* Slide-in Drawer Container */}
      <aside
        role="complementary"
        aria-label="NEXUS Telemetry Console"
        className="fixed top-0 right-0 h-full w-[350px] glass-panel rounded-l-2xl border-cyan-500/20 p-4 flex flex-col gap-3.5 z-50 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto select-none"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="font-display font-extrabold text-sm text-slate-100 tracking-wider">
              SYSTEM MATRIX
            </h2>
          </div>
          <button
            onClick={() => {
              Sound.playStateShift();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active AI Model Card */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-slate-950 via-cyan-950/20 to-purple-950/20 border border-cyan-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                ACTIVE PROVIDER
              </div>
              <div className="text-xs font-mono font-bold text-cyan-300">Gemini 3.6 Flash</div>
            </div>
          </div>
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            ONLINE
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between bg-slate-950/70 p-1 rounded-xl border border-slate-900 text-xs font-mono">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'METRICS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => setActiveTab('AGENTS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'AGENTS'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('NOTIFS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'NOTIFS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'LOGS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Logs
          </button>
        </div>

        {/* TAB 1: Hardware Matrix (8 Circular Gauges) */}
        {activeTab === 'METRICS' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                HARDWARE MATRIX
              </h3>
            </div>
            <SystemMetricsGauges metrics={metrics} />
          </div>
        )}

        {/* TAB 2: Running AI Agents */}
        {activeTab === 'AGENTS' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                  AGENT ORCHESTRATOR
                </h3>
              </div>
              <button
                onClick={() => setAgentsCollapsed(!agentsCollapsed)}
                className="text-slate-500 hover:text-slate-300"
              >
                {agentsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>

            {!agentsCollapsed && (
              <div className="space-y-1.5 font-mono text-[11px]">
                {agents.map((ag) => (
                  <div
                    key={ag.name}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-900 flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-semibold truncate">{ag.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded bg-black/40 ${ag.color}`}>
                      {ag.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Notifications Center */}
        {activeTab === 'NOTIFS' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                NOTIFICATIONS
              </h3>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              {notifications.map((n, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-900">
                  <div className="flex justify-between text-slate-200 font-bold mb-0.5">
                    <span className="truncate">{n.title}</span>
                    <span className="text-[9px] text-slate-500">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Developer Event Bus Logs */}
        {activeTab === 'LOGS' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
                EVENT BUS STREAM
              </h3>
            </div>

            <div className="bg-black/50 border border-slate-900 p-2.5 rounded-xl font-mono text-[10px] space-y-1.5">
              {logs.map((l, idx) => (
                <div key={idx} className="flex gap-2 leading-relaxed">
                  <span className="text-emerald-400 font-bold">{l.ts}</span>
                  <span className="text-slate-400 truncate">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <hr className="border-slate-900" />

        {/* SECTION: Memory Core Snapshot Feed */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              MEMORY SNAPSHOT
            </h3>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            {memoryFeed.map((m) => (
              <div key={m.key} className="p-2 rounded-lg bg-slate-950/50 border border-slate-900 flex justify-between">
                <span className="text-slate-500 font-bold">{m.key}</span>
                <span className="text-slate-200 truncate">{m.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: Current Workspace */}
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-900 flex items-center gap-2 font-mono text-xs mt-auto">
          <Folder className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-500 uppercase font-bold">WORKSPACE URI</div>
            <div className="text-slate-300 font-semibold truncate">g:/jarvis</div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default RightSidebar;
