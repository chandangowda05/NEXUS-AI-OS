/**
 * NEXUS AI Operating System
 * SidePanel Component — Icon-Only Collapsed Navigation Drawer
 *
 * Collapsed by default, icon-only layout with expansion on hover/click.
 * Categories:
 *  1. Home (LayoutDashboard)
 *  2. Conversation (MessageSquare / Sparkles)
 *  3. Projects (Folder)
 *  4. Memory (Brain)
 *  5. Automation (Zap)
 *  6. Coding (Code)
 *  7. Study (GraduationCap)
 *  8. Settings (Settings)
 *  9. Developer (Terminal)
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Folder,
  Brain,
  Zap,
  Code,
  GraduationCap,
  Settings,
  Terminal,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { NavigationTab } from '../types/assistant';
import { Sound } from '../utils/soundEffects';

interface SidePanelProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenChat: () => void;
}

interface NavItem {
  id: NavigationTab | 'chat';
  label: string;
  icon: React.FC<{ className?: string }>;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onOpenChat,
}) => {
  const [hovered, setHovered] = useState(false);

  const isExpanded = !collapsed || hovered;

  const items: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'chat', label: 'Conversation', icon: MessageSquare },
    { id: 'files', label: 'Projects', icon: Folder },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'tasks', label: 'Automation', icon: Zap },
    { id: 'coding', label: 'Coding', icon: Code },
    { id: 'study', label: 'Study', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'dev', label: 'Developer', icon: Terminal },
  ];

  return (
    <aside
      role="navigation"
      aria-label="System Navigator"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`glass-panel m-3 mr-0 mt-0 rounded-2xl border-cyan-500/20 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
        isExpanded ? 'w-56' : 'w-16'
      } shrink-0 select-none z-30`}
    >
      {/* Top Section */}
      <div className="p-2.5 space-y-3">
        {/* Header & Toggle Button */}
        <div className="flex items-center justify-between px-1.5 py-1">
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
                NEXUS
              </span>
            </div>
          )}
          <button
            onClick={() => {
              Sound.playStateShift();
              onToggleCollapse();
            }}
            aria-label={collapsed ? 'Expand navigator' : 'Collapse navigator'}
            className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-900 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all ml-auto flex items-center justify-center cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 9 Icon Items */}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'chat' ? false : activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  Sound.playStateShift();
                  if (item.id === 'chat') {
                    onOpenChat();
                  } else {
                    onSelectTab(item.id as NavigationTab);
                  }
                }}
                aria-pressed={isActive}
                title={!isExpanded ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans text-sm font-semibold border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.18)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-900/50'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-cyan-400 scale-110' : 'text-slate-400'
                  }`}
                />
                {isExpanded && (
                  <span className="truncate tracking-wide text-xs font-mono">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Identity Badge */}
      {isExpanded && (
        <div className="p-3 m-2.5 rounded-xl bg-slate-950/70 border border-slate-900 flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate font-bold text-slate-300">AI Companion Mode</span>
        </div>
      )}
    </aside>
  );
};

export default SidePanel;
