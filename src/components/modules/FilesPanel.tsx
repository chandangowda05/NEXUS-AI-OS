import React, { useState } from 'react';
import { FolderSearch, FileCode, FileText, Search, Folder, ExternalLink } from 'lucide-react';

export const FilesPanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const files = [
    { name: 'package.json', path: 'g:/jarvis/package.json', type: 'json', size: '1.2 KB' },
    { name: 'electron/main.ts', path: 'g:/jarvis/electron/main.ts', type: 'code', size: '2.4 KB' },
    { name: 'src/App.tsx', path: 'g:/jarvis/src/App.tsx', type: 'code', size: '3.1 KB' },
    { name: 'src/components/VoiceOrb.tsx', path: 'g:/jarvis/src/components/VoiceOrb.tsx', type: 'code', size: '4.2 KB' },
    { name: 'implementation_plan.md', path: 'g:/jarvis/docs/implementation_plan.md', type: 'doc', size: '8.5 KB' }
  ];

  const filtered = files.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
          <FolderSearch className="w-6 h-6 text-cyan-400" /> WORKSPACE FILE INDEXER
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Fast file search, codebase analyzer, and project navigation.
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search workspace files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((file, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              {file.type === 'code' ? (
                <FileCode className="w-5 h-5 text-cyan-400" />
              ) : file.type === 'doc' ? (
                <FileText className="w-5 h-5 text-purple-400" />
              ) : (
                <Folder className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <h4 className="text-xs font-bold text-slate-200">{file.name}</h4>
                <p className="text-[11px] font-mono text-slate-500">{file.path}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
              <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
