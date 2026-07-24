import React, { useState } from 'react';
import { Blocks, ToggleLeft, ToggleRight, ShieldCheck, Zap, Download } from 'lucide-react';
import { PluginMeta } from '../../types/assistant';

export const PluginsPanel: React.FC = () => {
  const [plugins, setPlugins] = useState<PluginMeta[]>([
    {
      id: 'plug-1',
      name: 'Windows Desktop Controller',
      version: '1.0.0',
      author: 'Phoenix Core',
      description: 'Native app launcher, storage drive telemetry, clipboard manager, media controls.',
      enabled: true,
      category: 'AUTOMATION'
    },
    {
      id: 'plug-2',
      name: 'Spotify Hardware Bridge',
      version: '1.2.0',
      author: 'Community',
      description: 'Control Spotify playback, search tracks, read current playing track.',
      enabled: true,
      category: 'INTEGRATION'
    },
    {
      id: 'plug-3',
      name: 'System Security & Face Unlock',
      version: '1.0.0',
      author: 'Phoenix Security',
      description: 'Biometric authorization guard for sensitive system commands.',
      enabled: false,
      category: 'UTILITY'
    },
    {
      id: 'plug-4',
      name: 'Web Intelligence & Search',
      version: '2.1.0',
      author: 'Phoenix Core',
      description: 'Live news summaries, web search synthesis, market stock quotes.',
      enabled: true,
      category: 'AI'
    }
  ]);

  const togglePlugin = (id: string) => {
    setPlugins(
      plugins.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <Blocks className="w-6 h-6 text-cyan-400" /> MODULAR PLUGIN REGISTRY
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Hot-loadable extensions, system integrations, and assistant capabilities.
          </p>
        </div>
        <button className="btn-holographic text-xs py-1.5 px-3">
          <Download className="w-3.5 h-3.5" /> Install Plugin
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className={`p-4 rounded-xl border transition-all ${
              plugin.enabled
                ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                : 'bg-slate-950/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">{plugin.name}</h3>
              </div>
              <button
                onClick={() => togglePlugin(plugin.id)}
                className="text-slate-400 hover:text-cyan-300 transition-colors"
              >
                {plugin.enabled ? (
                  <ToggleRight className="w-7 h-7 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">{plugin.description}</p>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
              <span>v{plugin.version} • {plugin.author}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" /> {plugin.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
