/**
 * NEXUS AI Operating System
 * StartupScreen — 3-Step Living AI Startup Experience
 *
 * Step 1: Ambient glow + logo fade-in + startup sound
 * Step 2: Personalized greeting ("Good Evening, Chandu." / "I'm ready whenever you are.")
 * Step 3: Cognitive Core centerpiece power-up sequence
 */

import React, { useState, useEffect } from 'react';
import { Zap, Sparkles, ShieldCheck } from 'lucide-react';
import { Sound } from '../utils/soundEffects';

interface StartupScreenProps {
  onComplete: () => void;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [greeting, setGreeting] = useState('Good Evening');

  useEffect(() => {
    // Determine greeting dynamically based on local clock
    const hr = new Date().getHours();
    if (hr < 12) setGreeting('Good Morning');
    else if (hr < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Play initial sci-fi boot sound chime
    Sound.playStartup();

    // Timeline sequence
    const t1 = setTimeout(() => setStep(2), 1100);
    const t2 = setTimeout(() => setStep(3), 2200);
    const t3 = setTimeout(() => onComplete(), 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onComplete}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onComplete()}
      aria-label="NEXUS Startup Experience. Click to skip sequence."
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden cursor-pointer select-none"
    >
      {/* Background Cosmic Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[90px]" />
      </div>

      {/* STEP 1: Logo & Brand Identity */}
      <div
        className={`flex flex-col items-center gap-4 transition-all duration-700 ${
          step >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-holo-pulse">
            <Zap className="w-10 h-10 text-cyan-400" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-cyan-500/20 animate-ping opacity-30" />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display font-black text-3xl tracking-widest text-slate-100">
            NEXUS
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            v1.0
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-500 tracking-widest uppercase flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          AUTONOMOUS AI OPERATING SYSTEM
        </div>
      </div>

      {/* STEP 2: Personalized Greeting */}
      <div
        className={`mt-8 text-center space-y-2 transition-all duration-700 ${
          step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1
          className="font-display font-black text-4xl md:text-5xl text-slate-100 tracking-tight"
          style={{ textShadow: '0 0 40px rgba(0, 240, 255, 0.3)' }}
        >
          {greeting}, Chandu.
        </h1>
        <p className="text-slate-400 text-lg font-light tracking-wide">
          I&apos;m ready whenever you are.
        </p>
      </div>

      {/* STEP 3: Cognitive Core Powering Up Indicator */}
      <div
        className={`mt-10 flex flex-col items-center gap-3 transition-all duration-700 ${
          step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs tracking-widest uppercase font-bold">
          <Sparkles className="w-4 h-4 animate-spin" />
          INITIALIZING COGNITIVE CORE...
        </div>
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Skip Hint */}
      <div className="absolute bottom-6 text-[10px] font-mono text-slate-600 tracking-widest uppercase">
        CLICK ANYWHERE TO SKIP INTRO
      </div>
    </div>
  );
};

export default StartupScreen;
