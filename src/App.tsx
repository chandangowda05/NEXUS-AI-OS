import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { CognitiveCore } from './components/CognitiveCore';
import { ChatContainer } from './components/ChatContainer';
import { SidePanel } from './components/SidePanel';
import { RightSidebar } from './components/RightSidebar';
import { HomeScreen } from './components/HomeScreen';
import { StartupScreen } from './components/StartupScreen';

import { MemoryPanel } from './components/modules/MemoryPanel';
import { TasksPanel } from './components/modules/TasksPanel';
import { PluginsPanel } from './components/modules/PluginsPanel';
import { FilesPanel } from './components/modules/FilesPanel';
import { CodingMode } from './components/modules/CodingMode';
import { StudyMode } from './components/modules/StudyMode';
import { SettingsPanel } from './components/modules/SettingsPanel';
import { DeveloperConsole } from './components/modules/DeveloperConsole';

import { SystemMetrics, ChatMessage, NavigationTab, CognitiveCoreState } from './types/assistant';
import { voiceService } from './services/voiceService';
import { VoiceStatus } from './types/voice';
import { Sound } from './utils/soundEffects';
import './styles/index.css';

export const App: React.FC = () => {
  const [isStartingUp, setIsStartingUp] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(voiceService.getStatus());

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuLoad: 16,
    ramUsedGB: 4.8,
    ramTotalGB: 16.0,
    ramPercent: 30,
    gpuPercent: 22,
    diskPercent: 44,
    cpuTempC: 46,
    batteryPercent: 94,
    isCharging: true,
    networkOnline: true,
    networkLatencyMs: 14,
    aiStatus: 'IDLE',
    micActive: false,
    soundEnabled: true,
    highContrast: false,
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(true);
  const [showHomeScreen, setShowHomeScreen] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        '**NEXUS Cognitive Engine Initialized.** Greetings, Sir. All 9 specialized AI agents, system observers, and memory cores are online and operational.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionCard: {
        title: 'Project Phoenix Control Center',
        description: 'Multi-Agent orchestrator & telemetry active.',
        type: 'SUCCESS',
        details: 'ONLINE',
      },
    },
  ]);

  // Voice Service Subscriptions
  useEffect(() => {
    const unsubStatus = voiceService.subscribe((status) => {
      setVoiceStatus(status);
      setMetrics((prev) => ({
        ...prev,
        micActive: status.isListening,
        aiStatus: status.isListening
          ? 'LISTENING'
          : status.state === 'error'
          ? 'ERROR'
          : status.isSpeaking
          ? 'THINKING'
          : prev.aiStatus === 'LISTENING'
          ? 'IDLE'
          : prev.aiStatus,
      }));
    });

    const unsubTranscript = voiceService.onTranscript((text, isFinal) => {
      if (isFinal && text.trim()) {
        if (voiceService.getAutoSendVoiceCommands()) {
          handleSendMessage(text.trim());
        }
      }
    });

    return () => {
      unsubStatus();
      unsubTranscript();
    };
  }, []);

  // System metrics IPC listener / fallback simulator
  useEffect(() => {
    if (window.electronAPI?.onMetricsUpdate) {
      const unsubscribe = window.electronAPI.onMetricsUpdate((updatedMetrics: Partial<SystemMetrics>) => {
        setMetrics((prev) => ({ ...prev, ...updatedMetrics }));
      });
      return () => unsubscribe();
    } else {
      const timer = setInterval(() => {
        setMetrics((prev) => {
          const randCpu = Math.floor(12 + Math.random() * 14);
          const randRamPercent = Math.floor(28 + Math.random() * 3);
          const randGpu = Math.floor(18 + Math.random() * 8);
          const randLatency = Math.floor(9 + Math.random() * 8);
          return {
            ...prev,
            cpuLoad: randCpu,
            ramPercent: randRamPercent,
            gpuPercent: randGpu,
            ramUsedGB: Number(((randRamPercent / 100) * prev.ramTotalGB).toFixed(1)),
            networkLatencyMs: randLatency,
          };
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, []);

  const speakAssistantResponse = useCallback(
    (text: string) => {
      if (metrics.soundEnabled) {
        voiceService.speak(text);
      }
    },
    [metrics.soundEnabled]
  );

  const handleSendMessage = async (text: string) => {
    setShowHomeScreen(false);
    setActiveTab('dashboard');
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMetrics((prev) => ({ ...prev, aiStatus: 'THINKING' }));

    if (window.electronAPI?.processUserRequest) {
      try {
        const response = await window.electronAPI.processUserRequest(text);
        const replyText = response.message || 'Processed through Cognitive Multi-Agent Engine.';
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionCard: response.actionCards?.[0],
        };
        setMessages((prev) => [...prev, assistantMsg]);
        Sound.playTaskComplete();
        speakAssistantResponse(replyText);
      } catch (err: any) {
        const errorMsgText = `Multi-Agent Orchestrator Error: ${err.message}`;
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'system',
          content: errorMsgText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
        Sound.playError();
        speakAssistantResponse(errorMsgText);
      } finally {
        setMetrics((prev) => ({ ...prev, aiStatus: 'IDLE' }));
      }
      return;
    }

    // Fallback simulation sequence through Cognitive Core states
    setTimeout(async () => {
      const lower = text.toLowerCase();
      let reply = "I've processed your prompt and indexed it to the SQLite cognitive store.";
      let actionCard: ChatMessage['actionCard'];
      let toolCard: ChatMessage['toolExecutionCard'];

      if (lower.includes('launch') || lower.includes('open')) {
        const appName = text.replace(/launch|open/gi, '').trim() || 'VS Code';
        setMetrics((prev) => ({ ...prev, aiStatus: 'EXECUTING' }));
        if (window.electronAPI?.executeCommand) {
          await window.electronAPI.executeCommand('LAUNCH_APP', { appName });
        }
        reply = `Initiated system proxy execution sequence to launch **${appName}**...`;
        actionCard = {
          title: `Process Dispatched: ${appName}`,
          description: 'Windows Process handle generated via Electron IPC',
          type: 'EXECUTION',
          details: 'LAUNCHED',
        };
        toolCard = {
          toolName: 'EXECUTE_PROCESS',
          status: 'SUCCESS',
          progressPercent: 100,
          logOutput: `Dispatched process: ${appName}.exe (PID: ${Math.floor(4000 + Math.random() * 2000)})`,
        };
        Sound.playTaskComplete();
      } else if (lower.includes('diagnostics') || lower.includes('health') || lower.includes('system')) {
        setMetrics((prev) => ({ ...prev, aiStatus: 'SEARCHING' }));
        reply = `**NEXUS Telemetry Report:**\n| Metric | Value | Status |\n| :--- | :--- | :--- |\n| CPU Load | ${metrics.cpuLoad}% | Optimal |\n| RAM Usage | ${metrics.ramUsedGB} GB (${metrics.ramPercent}%) | Stable |\n| GPU Load | ${metrics.gpuPercent}% | Nominal |\n| Latency | ${metrics.networkLatencyMs}ms | Fast |`;
        actionCard = {
          title: 'Diagnostics Scan Complete',
          description: 'All hardware sensors operating within nominal limits.',
          type: 'SUCCESS',
          details: 'STABLE',
        };
        Sound.playNotification();
      } else if (lower.includes('coding') || lower.includes('code')) {
        setActiveTab('coding');
        reply = 'Switched to **Coding Assistant Mode**. Multi-language compilers and prompt generators active.';
      } else if (lower.includes('study') || lower.includes('dsa')) {
        setActiveTab('study');
        reply = 'Loaded **Placement & Study Mode**. DSA templates and interview simulator ready.';
      } else if (lower.includes('memory')) {
        setActiveTab('memory');
        reply = 'Loaded **Memory Core** inspector panel.';
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard,
        toolExecutionCard: toolCard,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setMetrics((prev) => ({ ...prev, aiStatus: 'IDLE' }));
      speakAssistantResponse(reply);
    }, 1200);
  };

  const handleToggleMic = () => {
    console.log('🔥 [NEXUS/UI] Microphone button clicked (TopBar / ChatContainer)');
    console.log('🔥 [NEXUS/UI] Calling VoiceService.toggleListening()');
    voiceService.toggleListening();
    console.log('🔥 [NEXUS/UI] VoiceService.toggleListening() returned');
  };

  const handleToggleSound = () => {
    const nextSound = !metrics.soundEnabled;
    Sound.setEnabled(nextSound);
    if (!nextSound) {
      voiceService.stopSpeaking();
    }
    setMetrics((prev) => ({ ...prev, soundEnabled: nextSound }));
  };

  const handleToggleHighContrast = () => {
    const nextHC = !metrics.highContrast;
    setMetrics((prev) => ({ ...prev, highContrast: nextHC }));
  };

  const handleCoreClick = () => {
    console.log('🔥 [NEXUS/UI] Microphone button clicked (CognitiveCore / HomeScreen prompt mic)');
    console.log('🔥 [NEXUS/UI] Calling VoiceService.toggleListening()');
    voiceService.toggleListening();
    console.log('🔥 [NEXUS/UI] VoiceService.toggleListening() returned');
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
  };

  const handleSpeakMessage = (text: string) => {
    voiceService.speak(text);
  };

  const handleStateSelect = (newState: CognitiveCoreState) => {
    setMetrics((prev) => ({ ...prev, aiStatus: newState }));
  };

  const currentTranscript = voiceStatus.interimTranscript || voiceStatus.transcript;

  return (
    <div
      className={`h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans select-none ${
        metrics.highContrast ? 'high-contrast' : ''
      }`}
    >
      {/* 3-Step Startup Intro Animation Overlay */}
      {isStartingUp && <StartupScreen onComplete={() => setIsStartingUp(false)} />}

      {/* COLUMN 1: Collapsed Icon-Only Left Navigation Drawer */}
      <SidePanel
        activeTab={activeTab}
        onSelectTab={(t) => {
          setActiveTab(t);
          if (t === 'dashboard') setShowHomeScreen(true);
        }}
        collapsed={sidePanelCollapsed}
        onToggleCollapse={() => setSidePanelCollapsed(!sidePanelCollapsed)}
        onOpenChat={() => {
          setActiveTab('dashboard');
          setShowHomeScreen(false);
        }}
      />

      {/* COLUMN 2: Center Control Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Minimal Top Control Bar */}
        <TopBar
          metrics={metrics}
          voiceStatus={voiceStatus}
          onToggleMic={handleToggleMic}
          onToggleSound={handleToggleSound}
          onToggleHighContrast={handleToggleHighContrast}
          onToggleRightSidebar={() => setShowRightSidebar(!showRightSidebar)}
          onStopSpeaking={handleStopSpeaking}
        />

        {/* Dashboard vs Sub-Panel Views */}
        {activeTab === 'dashboard' ? (
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {showHomeScreen ? (
              <HomeScreen
                aiStatus={metrics.aiStatus}
                micActive={voiceStatus.isListening}
                transcript={currentTranscript}
                isSpeaking={voiceStatus.isSpeaking}
                isListening={voiceStatus.isListening}
                onCoreClick={handleCoreClick}
                onStateSelect={handleStateSelect}
                onQuickAction={(cmd) => {
                  setShowHomeScreen(false);
                  handleSendMessage(cmd);
                }}
                onOpenChat={() => setShowHomeScreen(false)}
              />
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header bar when in full conversation mode */}
                <div className="flex items-center gap-3 px-4 py-2 shrink-0 border-b border-slate-900/60">
                  <button
                    onClick={() => setShowHomeScreen(true)}
                    className="text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer"
                    aria-label="Return to AI Companion Home"
                  >
                    ← AI Companion Home
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-[11px] font-mono text-slate-400 font-bold tracking-widest uppercase">
                      Conversation Stream
                    </span>
                    <span className="ml-2 text-[9px] font-mono text-slate-600">
                      ({messages.length} messages)
                    </span>
                  </div>
                </div>

                <ChatContainer
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onMicClick={handleToggleMic}
                  isListening={voiceStatus.isListening}
                  isThinking={metrics.aiStatus === 'THINKING' || metrics.aiStatus === 'SEARCHING'}
                  transcript={currentTranscript}
                  onSpeakMessage={handleSpeakMessage}
                  onStopSpeaking={handleStopSpeaking}
                  isSpeaking={voiceStatus.isSpeaking}
                />
              </div>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col glass-panel m-3 mt-0 rounded-2xl border-cyan-500/20 overflow-hidden">
            {activeTab === 'memory' && <MemoryPanel />}
            {activeTab === 'tasks' && <TasksPanel />}
            {activeTab === 'plugins' && <PluginsPanel />}
            {activeTab === 'files' && <FilesPanel />}
            {activeTab === 'coding' && <CodingMode />}
            {activeTab === 'study' && <StudyMode />}
            {activeTab === 'settings' && <SettingsPanel />}
            {activeTab === 'dev' && <DeveloperConsole />}
          </main>
        )}
      </div>

      {/* Slide-In Right Telemetry & Control Drawer */}
      <RightSidebar
        metrics={metrics}
        isOpen={showRightSidebar}
        onClose={() => setShowRightSidebar(false)}
      />
    </div>
  );
};

export default App;
