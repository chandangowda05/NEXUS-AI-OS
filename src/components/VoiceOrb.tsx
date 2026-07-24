import React from 'react';
import { CognitiveCoreState } from '../types/assistant';

interface VoiceOrbProps {
  status: CognitiveCoreState;
  micActive: boolean;
  onOrbClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ status, micActive, onOrbClick }) => {
  return (
    <div
      onClick={onOrbClick}
      className="p-4 rounded-xl border border-cyan-500/20 bg-slate-950/40 text-center font-mono text-xs cursor-pointer"
    >
      <span className="text-cyan-400 font-bold">VoiceOrb (Legacy Component)</span>
      <p className="text-slate-500 mt-1">Status: {status} | Mic: {micActive ? 'ON' : 'OFF'}</p>
    </div>
  );
};
export default VoiceOrb;
