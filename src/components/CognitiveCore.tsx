/**
 * NEXUS AI Operating System
 * CognitiveCore — 400px Alive AI Centerpiece
 *
 * 9 state canvas visualizer with breathing animations, particle orbits, HUD rings,
 * floating motion, and sci-fi audio synthesizer integration.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CognitiveCoreState } from '../types/assistant';
import { Sound } from '../utils/soundEffects';

interface CognitiveCoreProps {
  state: CognitiveCoreState;
  micActive: boolean;
  transcript?: string;
  isSpeaking?: boolean;
  onCoreClick?: () => void;
  onStateSelect?: (s: CognitiveCoreState) => void;
}

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
}

const CFG: Record<
  CognitiveCoreState,
  {
    label: string;
    sub: string;
    primary: string;
    secondary: string;
    glow: string;
    pulse: number;
    rot: number;
    amp: number;
    particles: number;
    behavior: 'orbit' | 'expand' | 'converge' | 'sweep' | 'flow' | 'static' | 'pulse';
  }
> = {
  IDLE:      { label: 'STANDBY',           sub: 'Monitoring ambient systems',      primary: '#00f0ff', secondary: 'rgba(0,240,255,0.25)',   glow: 'rgba(0,240,255,0.4)',    pulse: 0.8,  rot: 0.008, amp: 5,  particles: 18, behavior: 'orbit'    },
  LISTENING: { label: 'AUDIO INGESTION',   sub: 'Processing voice input',           primary: '#1d8dff', secondary: 'rgba(0,120,255,0.35)',   glow: 'rgba(0,120,255,0.6)',    pulse: 2.2,  rot: 0.02,  amp: 22, particles: 36, behavior: 'expand'   },
  THINKING:  { label: 'REASONING',         sub: 'Synthesizing cognitive response',  primary: '#a855f7', secondary: 'rgba(168,85,247,0.35)',  glow: 'rgba(168,85,247,0.55)',  pulse: 1.6,  rot: 0.025, amp: 12, particles: 28, behavior: 'orbit'    },
  PLANNING:  { label: 'DAG PLANNING',      sub: 'Generating multi-step task graph', primary: '#f97316', secondary: 'rgba(249,115,22,0.35)', glow: 'rgba(249,115,22,0.55)',  pulse: 1.4,  rot: 0.018, amp: 14, particles: 24, behavior: 'pulse'    },
  SEARCHING: { label: 'MEMORY SCAN',       sub: 'Scanning knowledge & vector DB',   primary: '#06b6d4', secondary: 'rgba(245,158,11,0.3)',  glow: 'rgba(6,182,212,0.55)',   pulse: 1.8,  rot: 0.03,  amp: 16, particles: 20, behavior: 'sweep'    },
  EXECUTING: { label: 'EXECUTING',         sub: 'Dispatching system tool command',  primary: '#ef4444', secondary: 'rgba(245,158,11,0.4)',  glow: 'rgba(239,68,68,0.65)',   pulse: 2.6,  rot: 0.04,  amp: 26, particles: 40, behavior: 'flow'     },
  LEARNING:  { label: 'CONSOLIDATING',     sub: 'Indexing memory heuristics',       primary: '#10b981', secondary: 'rgba(16,185,129,0.35)', glow: 'rgba(16,185,129,0.55)',  pulse: 1.2,  rot: 0.012, amp: 10, particles: 30, behavior: 'converge' },
  OFFLINE:   { label: 'OFFLINE MODE',      sub: 'Running on local Ollama model',    primary: '#64748b', secondary: 'rgba(100,116,139,0.2)', glow: 'rgba(100,116,139,0.3)',  pulse: 0.4,  rot: 0.004, amp: 3,  particles: 10, behavior: 'static'   },
  ERROR:     { label: 'CRITICAL ANOMALY',  sub: 'Exception detected — intervening', primary: '#f43f5e', secondary: 'rgba(244,63,94,0.4)',   glow: 'rgba(244,63,94,0.7)',    pulse: 3.2,  rot: 0.007, amp: 30, particles: 14, behavior: 'pulse'    },
};

const ALL_STATES = Object.keys(CFG) as CognitiveCoreState[];

export const CognitiveCore: React.FC<CognitiveCoreProps> = ({
  state,
  micActive: _micActive,
  transcript,
  isSpeaking,
  onCoreClick,
  onStateSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const sweepRef = useRef(0);

  // Init particle pool
  useEffect(() => {
    particlesRef.current = Array.from({ length: 60 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 80 + Math.random() * 70,
      speed: (0.007 + Math.random() * 0.018) * (Math.random() > 0.5 ? 1 : -1),
      size: 1 + Math.random() * 2.5,
      opacity: 0.15 + Math.random() * 0.55,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf: number;
    let rot = 0;
    let pulse = 0;
    const cfg = CFG[state] ?? CFG.IDLE;
    const BASE = 110; // larger core radius for 400px centerpiece canvas

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      ctx.clearRect(0, 0, W, H);

      rot += cfg.rot;
      pulse += 0.022 * cfg.pulse;
      sweepRef.current += 0.03;

      const breathe = 1 + Math.sin(pulse) * (state === 'ERROR' ? 0.1 : 0.038);
      const r = BASE * breathe;

      // ── Outer HUD tick ring (48 ticks) ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rot * 0.45);
      for (let i = 0; i < 48; i++) {
        const a = (i * 7.5 * Math.PI) / 180;
        const isMajor = i % 12 === 0;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r + 44), Math.sin(a) * (r + 44));
        ctx.lineTo(Math.cos(a) * (r + (isMajor ? 50 : 47)), Math.sin(a) * (r + (isMajor ? 50 : 47)));
        ctx.strokeStyle = isMajor ? cfg.primary : 'rgba(255,255,255,0.06)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.stroke();
      }
      ctx.restore();

      // ── Radar sweep (SEARCHING only) ──
      if (state === 'SEARCHING') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r + 44, sweepRef.current, sweepRef.current + 0.55);
        ctx.closePath();
        const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, r + 44);
        sg.addColorStop(0, 'rgba(6,182,212,0.35)');
        sg.addColorStop(1, 'rgba(6,182,212,0)');
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.restore();
      }

      // ── Rotating HUD arc bands ──
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.shadowBlur = 12;
      ctx.shadowColor = cfg.glow;
      ctx.beginPath();
      ctx.arc(0, 0, r + 26, 0, Math.PI * 0.72);
      ctx.strokeStyle = cfg.primary;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(0, 0, r + 26, Math.PI * 0.92, Math.PI * 1.7);
      ctx.strokeStyle = cfg.secondary;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // ── Counter-rotation ring (THINKING special) ──
      if (state === 'THINKING') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-rot * 2.1);
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, r + 36, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168,85,247,0.35)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Particles ──
      const pool = particlesRef.current.slice(0, cfg.particles);
      pool.forEach((p) => {
        if (cfg.behavior === 'expand') { p.radius += 0.4; if (p.radius > 155) p.radius = 25; }
        else if (cfg.behavior === 'converge') { p.radius -= 0.35; if (p.radius < 20) p.radius = 140; }
        p.angle += p.speed * (state === 'EXECUTING' ? 2.4 : 1);
        const px = cx + Math.cos(p.angle) * (p.radius * breathe);
        const py = cy + Math.sin(p.angle) * (p.radius * breathe);
        const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
        pg.addColorStop(0, cfg.primary);
        pg.addColorStop(1, 'transparent');
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ── Waveform ring ──
      ctx.save();
      ctx.shadowBlur = hovered ? 28 : 18;
      ctx.shadowColor = cfg.glow;
      ctx.strokeStyle = cfg.primary;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      const pts = 80;
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const w = Math.sin(a * 8 + rot * 7) * cfg.amp +
                  Math.cos(a * 4 - rot * 3) * (cfg.amp * 0.38);
        const wr = r + w;
        const x = cx + Math.cos(a) * wr;
        const y = cy + Math.sin(a) * wr;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // ── Core glass gradient fill ──
      const cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, r - 12);
      cg.addColorStop(0, cfg.primary + '45');
      cg.addColorStop(0.5, cfg.glow.replace('0.65', '0.18').replace('0.55', '0.14').replace('0.6', '0.14'));
      cg.addColorStop(1, 'rgba(4,6,13,0.97)');
      ctx.beginPath();
      ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      // Inner ring border
      ctx.beginPath();
      ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [state, hovered]);

  const cfg = CFG[state] ?? CFG.IDLE;

  return (
    <div className="flex flex-col items-center gap-2 shrink-0 select-none">
      {/* Optional State selector bar for developer/testing */}
      {onStateSelect && (
        <div className="flex flex-wrap items-center justify-center gap-1 px-3 py-1 bg-slate-950/80 border border-slate-900 rounded-full text-[9px] font-mono max-w-full z-10">
          <span className="text-slate-500 uppercase tracking-widest font-bold mr-0.5">CORE STATE:</span>
          {ALL_STATES.map((s) => (
            <button
              key={s}
              onClick={() => { Sound.playStateShift(); onStateSelect(s); }}
              className="px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
              style={{
                background: state === s ? CFG[s].primary + '22' : 'transparent',
                color: state === s ? CFG[s].primary : '#64748b',
                border: `1px solid ${state === s ? CFG[s].primary + '55' : 'transparent'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Floating 400px Canvas Container */}
      <div
        role="button"
        aria-label={`NEXUS Cognitive Core — ${state}. Click to activate.`}
        tabIndex={0}
        onClick={() => { console.log('🔥 [NEXUS/UI] Microphone button clicked (CognitiveCore canvas element)'); Sound.playListen(); onCoreClick?.(); }}
        onKeyDown={(e) => e.key === 'Enter' && onCoreClick?.()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center cursor-pointer group focus:outline-none animate-pulse"
        style={{
          width: 400,
          height: 400,
          animationDuration: '6s',
        }}
      >
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          aria-hidden="true"
          className="absolute inset-0 m-auto pointer-events-none transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Center Identity Text */}
        <div className="z-10 text-center pointer-events-none flex flex-col items-center gap-1.5">
          <span
            className="font-display font-black text-4xl tracking-widest text-slate-100"
            style={{ textShadow: `0 0 24px ${cfg.glow}` }}
          >
            {import.meta.env.VITE_ASSISTANT_NAME ?? 'NEXUS'}
          </span>

          <div
            className="text-[10px] font-mono font-bold tracking-widest uppercase px-3.5 py-1 rounded-full border shadow-sm"
            style={{
              color: cfg.primary,
              borderColor: cfg.primary + '55',
              background: cfg.primary + '18',
            }}
          >
            {cfg.label}
          </div>

          <div className="text-[10px] font-mono text-slate-400 max-w-[170px] text-center leading-tight truncate">
            {transcript ? `"${transcript}"` : isSpeaking ? '🔊 Synthesizing speech...' : cfg.sub}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveCore;
