import React, { useState, useEffect } from 'react';
import { Terminal, Activity, Cpu, Shield, Database, Radio, Sparkles, Network } from 'lucide-react';

export const DeveloperConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'agents' | 'graph' | 'audit'>('events');
  const [events, setEvents] = useState<any[]>([
    { id: 'evt-1', topic: 'VOICE_RECEIVED', priority: 'HIGH', timestamp: '19:33:10', data: { transcript: 'Hey Nexus, check system telemetry' } },
    { id: 'evt-2', topic: 'COGNITIVE_DECISION', priority: 'MEDIUM', timestamp: '19:33:11', data: { approved: true, score: 0.82, reason: 'Approved with high confidence' } },
    { id: 'evt-3', topic: 'MODEL_SWITCHED', priority: 'LOW', timestamp: '19:33:12', data: { providerId: 'claude-sonnet', name: 'Anthropic Claude 3.5 Sonnet' } },
    { id: 'evt-4', topic: 'MEMORY_STORED', priority: 'LOW', timestamp: '19:33:15', data: { tier: 'LONG', key: 'Active Repository', value: 'g:/jarvis' } }
  ]);

  const auditLogs = [
    { id: 'audit-1', agent: 'AgentManager', tool: 'tool_launch_app', params: '{"appName":"code"}', status: 'GRANTED', time: '19:30:12' },
    { id: 'audit-2', agent: 'AutomationAgent', tool: 'tool_search_files', params: '{"query":"src"}', status: 'GRANTED', time: '19:31:05' },
    { id: 'audit-3', agent: 'SecurityAgent', tool: 'tool_powershell', params: '{"command":"rm -rf"}', status: 'REJECTED_UNSAFE', time: '19:32:00' }
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-cyan-400" /> DEVELOPER TELEMETRY CONSOLE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-time event stream, Agent DAG execution graph, Cognitive Knowledge Graph, and LLM inspector.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">Live Bus Streaming</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'events'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline mr-1.5" /> Event Bus Stream
        </button>
        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'agents'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 inline mr-1.5" /> Agent DAG Inspector
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'graph'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5 inline mr-1.5" /> Knowledge Graph
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'audit'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 inline mr-1.5" /> Security Audit Log
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'events' && (
        <div className="space-y-2 font-mono text-xs">
          {events.map((evt) => (
            <div key={evt.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  evt.priority === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                  evt.priority === 'HIGH' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                  'bg-cyan-950 text-cyan-300 border border-cyan-800'
                }`}>
                  {evt.priority}
                </span>
                <span className="font-bold text-slate-200">{evt.topic}</span>
                <span className="text-slate-400 truncate max-w-md">{JSON.stringify(evt.data)}</span>
              </div>
              <span className="text-slate-500 text-[11px]">{evt.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-2 font-mono text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">{log.agent}</span>
                <span className="text-cyan-400">{log.tool}</span>
                <span className="text-slate-500">{log.params}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                log.status === 'GRANTED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
          <Network className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200">Knowledge Graph Node Matrix</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Entities: [NEXUS, Project Phoenix, User, VS Code, TypeScript]
            <br />
            Relations: NEXUS --(MANAGES)&gt; Project Phoenix --(USES)&gt; TypeScript
          </p>
        </div>
      )}
    </div>
  );
};
