import React, { useState } from 'react';
import { Code, Play, Bug, FileCheck, Cpu, Sparkles, Copy, Check } from 'lucide-react';

export const CodingMode: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('TypeScript');
  const [codePrompt, setCodePrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [outputCode, setOutputCode] = useState<string>(
    `// NEXUS AI Generated Solution\n// Language: TypeScript\n\ninterface SystemMetrics {\n  cpuLoad: number;\n  ramPercent: number;\n}\n\nexport function optimizeMemoryUsage(metrics: SystemMetrics): boolean {\n  console.log(\`[NEXUS] Monitoring CPU \${metrics.cpuLoad}% & RAM \${metrics.ramPercent}%\`);\n  return metrics.ramPercent < 80;\n}`
  );

  const languages = ['TypeScript', 'Python', 'Java', 'Rust', 'Go', 'C++', 'SQL', 'React'];

  const handleGenerate = (action: string) => {
    setOutputCode(
      `// NEXUS AI Assistant [Action: ${action}] [Language: ${selectedLang}]\n\nfunction handle${action.replace(/\s+/g, '')}() {\n  // Automated generation for ${codePrompt || 'sample implementation'}\n  console.log("Executing high-performance ${selectedLang} routine...");\n}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-100 flex items-center gap-2">
            <Code className="w-6 h-6 text-cyan-400" /> DEDICATED CODING ASSISTANT MODE
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Multi-language code generation, refactoring, bug isolation, and unit test synthesis.
          </p>
        </div>
      </div>

      {/* Language Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">Language:</span>
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLang(lang)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              selectedLang === lang
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-bold'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* Code Prompt Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <textarea
          rows={3}
          value={codePrompt}
          onChange={(e) => setCodePrompt(e.target.value)}
          placeholder={`Describe the algorithm, bug fix, or refactor needed in ${selectedLang}...`}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
        />
        <div className="flex items-center gap-3">
          <button onClick={() => handleGenerate('Generate Code')} className="btn-holographic text-xs py-1.5 px-4">
            <Sparkles className="w-3.5 h-3.5" /> Generate Solution
          </button>
          <button onClick={() => handleGenerate('Debug Code')} className="px-4 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs font-mono flex items-center gap-1.5 hover:bg-rose-900/30">
            <Bug className="w-3.5 h-3.5 text-rose-400" /> Debug & Fix
          </button>
          <button onClick={() => handleGenerate('Generate Tests')} className="px-4 py-1.5 rounded-lg border border-purple-500/40 bg-purple-950/20 text-purple-300 text-xs font-mono flex items-center gap-1.5 hover:bg-purple-900/30">
            <FileCheck className="w-3.5 h-3.5 text-purple-400" /> Generate Unit Tests
          </button>
        </div>
      </div>

      {/* Code Previewer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono">
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> {selectedLang} Output
          </span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-cyan-200 overflow-x-auto">
          <code>{outputCode}</code>
        </pre>
      </div>
    </div>
  );
};
