/**
 * NEXUS AI OS — SplashScreen Component
 *
 * Provides a professional, polished startup splash screen experience:
 * - Centered glowing NEXUS logo & title
 * - Real-time progress bar (0% - 100%) driven by StartupGuard & StartupState
 * - Dynamic task status reporting
 * - System ready timing indicator
 * - Smooth hold (300-500ms) & fade-out opacity transition
 */

import React, { useEffect } from 'react';
import { Zap, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useStartupState, StartupState } from '../services/StartupState';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { progress, currentTask, isComplete, durationMs, isFadingOut } = useStartupState();

  useEffect(() => {
    let holdTimer: NodeJS.Timeout;
    let fadeTimer: NodeJS.Timeout;

    if (isComplete && !isFadingOut) {
      // 1. Hold at 100% for ~350ms to display complete status
      holdTimer = setTimeout(() => {
        StartupState.setFadingOut(true);

        // 2. Trigger 400ms fade-out animation then hide splash screen
        fadeTimer = setTimeout(() => {
          console.log('[NEXUS] Splash screen hidden');
          StartupState.setHidden(true);
          onComplete();
        }, 400);
      }, 350);
    }

    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [isComplete, isFadingOut, onComplete]);

  return (
    <div
      role="region"
      aria-label="NEXUS Application Startup Splash Screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden select-none transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Cosmic Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 py-10 rounded-3xl glass-panel border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl shadow-[0_0_80px_rgba(0,240,255,0.15)] space-y-8">
        
        {/* LOGO & BRAND IDENTITY */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-holo-pulse">
              <Zap className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-cyan-500/20 animate-ping opacity-30" />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="font-display font-black text-3xl tracking-widest text-slate-100">
              NEXUS
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              v1.0
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            AUTONOMOUS AI OPERATING SYSTEM
          </div>
        </div>

        {/* PROGRESS BAR & PERCENTAGE */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">System Ready</span>
                  {durationMs !== null && (
                    <span className="text-slate-400">({durationMs} ms)</span>
                  )}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Initializing...</span>
                </>
              )}
            </span>
            <span className="text-cyan-400 font-bold tracking-wider">{progress}%</span>
          </div>

          {/* Outer Track */}
          <div className="w-full h-2 bg-slate-950/80 rounded-full p-0.5 border border-slate-800/80 overflow-hidden shadow-inner">
            {/* Inner Animated Gradient Bar */}
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(0,240,255,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Task Description */}
          <div className="text-center text-[11px] font-mono text-slate-400 min-h-[18px] tracking-wide">
            {currentTask}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
