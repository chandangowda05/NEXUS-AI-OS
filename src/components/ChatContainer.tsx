import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Mic,
  Terminal,
  Copy,
  Check,
  Sparkles,
  Code2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Wrench,
} from 'lucide-react';
import { ChatMessage } from '../types/assistant';
import { Sound } from '../utils/soundEffects';

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onMicClick: () => void;
  isListening: boolean;
  isThinking?: boolean;
}

const ACTION_CARD_STYLES: Record<
  string,
  { icon: React.ReactElement; border: string; bg: string; text: string }
> = {
  SUCCESS: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    border: 'border-emerald-500/25',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
  },
  INFO: {
    icon: <Info className="w-4 h-4 text-cyan-400" />,
    border: 'border-cyan-500/25',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-400',
  },
  WARNING: {
    icon: <AlertCircle className="w-4 h-4 text-amber-400" />,
    border: 'border-amber-500/25',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
  },
  EXECUTION: {
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    border: 'border-purple-500/25',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
  },
};

const QUICK_ACTIONS = [
  { label: '⚡ Run Diagnostics', command: 'Run system diagnostics' },
  { label: '💻 Coding Mode', command: 'Switch to coding mode' },
  { label: '🎓 Study DSA', command: 'Study DSA roadmap' },
  { label: '🧠 Show Memories', command: 'Show active memories' },
];

/**
 * Lightweight safe Markdown & Table parser
 */
const renderMessageContent = (text: string) => {
  const lines = text.split('\n');

  // Detect table formatting (lines containing '|' separators)
  const isTable = lines.some((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));

  if (isTable) {
    const tableRows = lines
      .filter((l) => l.trim().startsWith('|'))
      .map((row) =>
        row
          .split('|')
          .filter((c, i, a) => i > 0 && i < a.length - 1)
          .map((cell) => cell.trim())
      );

    if (tableRows.length >= 2) {
      const headers = tableRows[0];
      const contentRows = tableRows.slice(1).filter((r) => !r.every((c) => c.includes('---')));

      return (
        <div className="my-2 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-cyan-400 font-bold">
              <tr>
                {headers.map((h, idx) => (
                  <th key={idx} className="p-2.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {contentRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // Standard line parsing
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
    const content = isBullet ? line.trim().substring(2) : line;

    const parts: React.ReactNode[] = [];
    let currentIdx = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > currentIdx) {
        parts.push(content.substring(currentIdx, match.index));
      }

      const matchText = match[0];
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={match.index} className="font-extrabold text-white">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code key={match.index} className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-950 border border-slate-900 text-cyan-300">
            {matchText.slice(1, -1)}
          </code>
        );
      }

      currentIdx = regex.lastIndex;
    }

    if (currentIdx < content.length) {
      parts.push(content.substring(currentIdx));
    }

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc list-outside text-slate-300 py-0.5">
          {parts}
        </li>
      );
    }

    return (
      <p key={lineIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[1.2rem] text-slate-300'}>
        {parts}
      </p>
    );
  });
};

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  onSendMessage,
  onMicClick,
  isListening,
  isThinking,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      Sound.playNotification();
      onSendMessage(trimmed);
      setInput('');
      inputRef.current?.focus();
    },
    [input, onSendMessage]
  );

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      Sound.playNotification();
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  return (
    <section
      role="log"
      aria-label="NEXUS Communication Dock"
      className="flex-1 flex flex-col glass-panel m-3 mt-0 rounded-2xl border-cyan-500/20 overflow-hidden min-h-[280px]"
    >
      {/* Message Stream */}
      <div
        ref={scrollRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto p-4 space-y-4 font-sans"
      >
        {messages.map((msg) => (
          <article
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 px-1 text-[10px] font-mono tracking-widest text-slate-500">
              {msg.sender === 'assistant' ? (
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-glow-cyan" aria-hidden="true" /> NEXUS
                </span>
              ) : msg.sender === 'user' ? (
                <span className="text-slate-300 font-semibold">YOU</span>
              ) : (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Terminal className="w-3 h-3" aria-hidden="true" /> SYSTEM LOG
                </span>
              )}
              <time className="opacity-75">{msg.timestamp}</time>
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed border transition-all ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/10 border-cyan-500/35 text-slate-100 rounded-tr-none shadow-[0_4px_16px_rgba(0,240,255,0.06)]'
                  : msg.sender === 'assistant'
                  ? 'bg-slate-950/80 border-slate-900/90 text-slate-100 rounded-tl-none backdrop-blur-md'
                  : 'bg-amber-950/15 border-amber-500/20 text-amber-200/90 rounded-tl-none font-mono text-xs'
              }`}
            >
              <div className="space-y-1">{renderMessageContent(msg.content)}</div>

              {/* Tool Execution Card with Progress */}
              {msg.toolExecutionCard && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-900 font-mono text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      {msg.toolExecutionCard.toolName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {msg.toolExecutionCard.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-500"
                      style={{ width: `${msg.toolExecutionCard.progressPercent}%` }}
                    />
                  </div>
                  <pre className="text-[10px] text-slate-400 bg-black/40 p-2 rounded border border-slate-900 overflow-x-auto">
                    <code>{msg.toolExecutionCard.logOutput}</code>
                  </pre>
                </div>
              )}

              {/* Code Snippet Card */}
              {msg.codeSnippet && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-900 bg-slate-950/90">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {msg.codeSnippet.language.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleCopyCode(msg.codeSnippet!.code, msg.id)}
                      className="flex items-center gap-1 hover:text-slate-200 transition-colors"
                      aria-label="Copy code snippet"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-xs font-mono text-cyan-200/90 overflow-x-auto select-text leading-relaxed">
                    <code>{msg.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Action Card */}
              {msg.actionCard && (() => {
                const style = ACTION_CARD_STYLES[msg.actionCard.type] ?? ACTION_CARD_STYLES.INFO;
                return (
                  <div
                    className={`mt-3 p-3 rounded-xl border flex items-center justify-between gap-4 ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${style.border} bg-black/40`}
                        aria-hidden="true"
                      >
                        {style.icon}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate">
                          {msg.actionCard.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {msg.actionCard.description}
                        </p>
                      </div>
                    </div>
                    {msg.actionCard.details && (
                      <span
                        className={`text-[9.5px] font-mono px-2 py-0.5 rounded border shrink-0 bg-black/40 ${style.text} ${style.border}`}
                      >
                        {msg.actionCard.details}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </article>
        ))}

        {/* Typing Animation Simulator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs p-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>NEXUS is reasoning and synthesizing response...</span>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t border-slate-900 bg-slate-950/40 shrink-0">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold shrink-0">
          SUGGESTIONS:
        </span>
        {QUICK_ACTIONS.map(({ label, command }) => (
          <button
            key={command}
            onClick={() => {
              Sound.playNotification();
              onSendMessage(command);
            }}
            className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-950/60 hover:bg-cyan-950/30 border border-slate-900 hover:border-cyan-500/30 px-3 py-1 rounded-full transition-all whitespace-nowrap cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Input Dock */}
      <form
        onSubmit={handleSubmit}
        aria-label="Send prompt to NEXUS"
        className="p-3.5 bg-slate-950/60 border-t border-slate-900 flex items-center gap-3 shrink-0"
      >
        <button
          type="button"
          onClick={() => {
            Sound.playListen();
            onMicClick();
          }}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
          className={`p-3 rounded-xl border transition-all shrink-0 cursor-pointer ${
            isListening
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.45)] animate-pulse'
              : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Issue a command or ask NEXUS anything..."
          aria-label="Command text input"
          className="flex-1 bg-slate-950/80 border border-slate-900 focus:border-cyan-500/40 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
        />

        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Execute prompt"
          className="btn-holographic disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          <span>EXECUTE</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
};
