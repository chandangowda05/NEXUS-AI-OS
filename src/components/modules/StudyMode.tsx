import React, { useState } from 'react';
import { GraduationCap, BookOpen, Layers, Target, CheckCircle2, ArrowRight } from 'lucide-react';

export const StudyMode: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState('Data Structures & Algorithms');

  const topics = [
    { title: 'Data Structures & Algorithms', progress: 75, modules: ['Graphs & Dijkstra', 'Dynamic Programming', 'Tries & Segment Trees'] },
    { title: 'System Design & Architecture', progress: 60, modules: ['Load Balancers & Reverse Proxies', 'Consistent Hashing', 'Message Queues (Kafka)'] },
    { title: 'Operating Systems & Concurrency', progress: 85, modules: ['Virtual Memory & Paging', 'Thread Locks & Mutexes', 'IPC Signals'] },
    { title: 'DBMS & Distributed SQL', progress: 50, modules: ['B-Tree Index Optimization', 'ACID Transactions', 'Sharding'] }
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-cyan-400" /> STUDY & PLACEMENT PREPARATION COMPANION
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Master DSA, System Design, DBMS, OS, Networks, and prepare for top tier technical interviews.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((t, i) => (
          <div
            key={i}
            onClick={() => setSelectedTopic(t.title)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedTopic === t.title
                ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" /> {t.title}
              </h3>
              <span className="text-xs font-mono font-bold text-cyan-400">{t.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${t.progress}%` }} />
            </div>
            <div className="space-y-1">
              {t.modules.map((m, j) => (
                <div key={j} className="flex items-center gap-2 text-[11px] text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Mock Interview Session */}
      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" /> Start AI Mock Technical Interview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-enabled mock interview simulation covering {selectedTopic} with real-time feedback.
          </p>
        </div>
        <button className="btn-holographic text-xs py-2 px-4">
          <span>Launch Interview</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
