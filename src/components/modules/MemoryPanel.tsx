import React, { useState } from 'react';
import { Brain, Search, Plus, Sparkles, Tag, Clock, Database, Trash2 } from 'lucide-react';
import { MemoryEntry } from '../../types/assistant';
import { useSupabaseMemory } from '../../hooks/useSupabaseMemory';

export const MemoryPanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const { memories, addMemory, removeMemory, isLoading } = useSupabaseMemory();

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryEntry['category']>('PREFERENCE');

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newValue) return;
    const entry: MemoryEntry = {
      id: `mem-${Date.now()}`,
      category: newCategory,
      key: newKey,
      value: newValue,
      confidence: 1.0,
      updatedAt: 'Just now'
    };
    await addMemory(entry);
    setNewKey('');
    setNewValue('');
  };

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.value.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <Brain className="w-6 h-6 text-cyan-400" /> MULTI-TIER MEMORY ENGINE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Short-term session context, long-term preferences, and semantic knowledge graph.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-300">
            {isLoading ? 'Loading...' : `${memories.length} Key-Values Indexed`}
          </span>
        </div>
      </div>

      {/* Add Memory Form */}
      <form onSubmit={handleAddMemory} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-cyan-400" /> STORE NEW MEMORY FACT
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="PREFERENCE">PREFERENCE</option>
            <option value="PROJECT">PROJECT</option>
            <option value="GOAL">GOAL</option>
            <option value="HABIT">HABIT</option>
            <option value="FACT">FACT</option>
          </select>
          <input
            type="text"
            placeholder="Key (e.g. Favorite Editor)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            placeholder="Value (e.g. VS Code with Vim extension)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <button type="submit" className="btn-holographic text-xs py-1.5 px-4">
          <Sparkles className="w-3.5 h-3.5" /> Save Memory
        </button>
      </form>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search memory entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mem) => (
          <div key={mem.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {mem.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {mem.updatedAt}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMemory(mem.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400"
                  aria-label="Delete memory entry"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <h4 className="text-xs font-bold text-slate-200">{mem.key}</h4>
            <p className="text-xs text-slate-400 mt-1 font-mono">{mem.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
