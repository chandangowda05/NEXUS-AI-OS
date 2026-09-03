import React, { useState } from 'react';
import { Settings, Shield, Mic, Volume2, Palette, Sparkles, Save } from 'lucide-react';
import { UserPreferences } from '../../types/assistant';
import { useSupabasePreferences } from '../../hooks/useSupabasePreferences';

export const SettingsPanel: React.FC = () => {
  const { prefs, setPrefs, savePrefs, isLoading } = useSupabasePreferences();

  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await savePrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" /> SYSTEM SETTINGS & PREFERENCES
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Customize assistant identity, voice engine, security parameters, and wake word.
          </p>
        </div>
        {isLoading && (
          <span className="text-xs font-mono text-cyan-400">Loading from cloud...</span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Assistant Identity */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Identity & Personality
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Assistant Name</label>
              <input
                type="text"
                value={prefs.assistantName}
                onChange={(e) => setPrefs({ ...prefs, assistantName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Project Codename</label>
              <input
                type="text"
                value={prefs.codename}
                onChange={(e) => setPrefs({ ...prefs, codename: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Personality Mode</label>
              <select
                value={prefs.personalityMode}
                onChange={(e) => setPrefs({ ...prefs, personalityMode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="HUMOROUS">Humorous & Witty (IRON MAN style)</option>
                <option value="PROFESSIONAL">Professional & Analytical</option>
                <option value="CONCISE">Concise & Direct</option>
                <option value="TEACHER">Teacher & Socratic Mentor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Voice & Wake Word */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
            <Mic className="w-4 h-4" /> Voice & Continuous Listening
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Custom Wake Word</label>
              <input
                type="text"
                value={prefs.wakeWord}
                onChange={(e) => setPrefs({ ...prefs, wakeWord: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Voice Synthesis Engine</label>
              <select
                value={prefs.voiceName}
                onChange={(e) => setPrefs({ ...prefs, voiceName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Holographic Deep Natural">Holographic Deep Natural (Ultra Realistic)</option>
                <option value="Jarvis Metallic Studio">Jarvis Metallic Studio</option>
                <option value="Nova Neural Voice">Nova Neural Voice</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security & Theme */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-4 h-4" /> Security & Biometrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Authentication Method</label>
              <select
                value={prefs.securityLevel}
                onChange={(e) => setPrefs({ ...prefs, securityLevel: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="WINDOWS_HELLO">Windows Hello / Biometric</option>
                <option value="PIN">Security PIN</option>
                <option value="PASSWORD">Master Password</option>
                <option value="NONE">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-holographic text-xs py-2 px-5">
            <Save className="w-4 h-4" /> Save Preferences
          </button>
          {saved && <span className="text-xs font-mono text-emerald-400 font-bold">Preferences updated!</span>}
        </div>
      </form>
    </div>
  );
};
