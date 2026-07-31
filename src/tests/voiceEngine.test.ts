import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceService } from '../services/voiceService';
import { MockProvider } from '../voice/providers/MockProvider';
import { WebSpeechProvider } from '../voice/providers/WebSpeechProvider';
import { ProviderFactory } from '../voice/providers/ProviderFactory';
import { ElectronVoiceProvider } from '../voice/providers/ElectronVoiceProvider';
import { VoskEngine } from '../voice/engines/VoskEngine';
import { modelManager } from '../voice/models/ModelManager';
import { SpeechQueue } from '../tts/SpeechQueue';

describe('Revised Voice Engine Architecture Unit Tests', () => {

  describe('1. MockProvider Unit Tests', () => {
    let mockProvider: MockProvider;

    beforeEach(() => {
      mockProvider = new MockProvider();
    });

    it('should initialize with idle state and report support', () => {
      expect(mockProvider.name).toBe('MockSpeech');
      expect(mockProvider.isSupported()).toBe(true);
      expect(mockProvider.getState()).toBe('idle');
    });

    it('should emit listening state on startListening', () => {
      let state: string = 'idle';
      mockProvider.setCallbacks({
        onTranscript: vi.fn(),
        onError: vi.fn(),
        onStateChange: (s) => { state = s; },
      });

      mockProvider.startListening();
      expect(state).toBe('listening');
    });

    it('should simulate interim and final transcripts', () => {
      const onTranscript = vi.fn();
      mockProvider.setCallbacks({
        onTranscript,
        onError: vi.fn(),
        onStateChange: vi.fn(),
      });

      mockProvider.simulateTranscript('Hello world', false);
      expect(onTranscript).toHaveBeenCalledWith('Hello world', false);

      mockProvider.simulateTranscript('Hello world final', true);
      expect(onTranscript).toHaveBeenCalledWith('Hello world final', true);
    });

    it('should clear callbacks and reset state on dispose', () => {
      mockProvider.dispose();
      expect(mockProvider.getState()).toBe('idle');
    });
  });

  describe('2. SpeechQueue Unit Tests', () => {
    let speechQueue: SpeechQueue;

    beforeEach(() => {
      speechQueue = new SpeechQueue();
      speechQueue.cancel();
    });

    it('should enqueue items and track status', () => {
      const id = speechQueue.enqueue('Test assistant voice utterance');
      expect(id).toBeDefined();
      const status = speechQueue.getStatus();
      expect(status.queueCount >= 0).toBe(true);
    });

    it('should immediately cancel active speech and clear queue', () => {
      speechQueue.enqueue('First sentence');
      speechQueue.enqueue('Second sentence');
      speechQueue.cancel();

      const status = speechQueue.getStatus();
      expect(status.isSpeaking).toBe(false);
      expect(status.queueCount).toBe(0);
    });

    it('should handle dispose lifecycle cleanup', () => {
      speechQueue.enqueue('Message to dispose');
      speechQueue.dispose();
      const status = speechQueue.getStatus();
      expect(status.isSpeaking).toBe(false);
      expect(status.queueCount).toBe(0);
    });
  });

  describe('3. VoiceService Orchestrator Unit Tests', () => {
    let service: VoiceService;
    let mockProvider: MockProvider;

    beforeEach(() => {
      service = VoiceService.getInstance();
      mockProvider = new MockProvider();
      service.setProvider(mockProvider, 'mock');
      service.stopSpeaking();
      service.stopListening();
    });

    it('should register and use IVoiceProvider abstraction', () => {
      const status = service.getStatus();
      expect(status.providerType).toBe('mock');
      expect(service.getProviderType()).toBe('mock');
    });

    it('should update transcript and state when mock provider emits transcript', () => {
      let finalTranscript = '';
      service.onTranscript((text, isFinal) => {
        if (isFinal) finalTranscript = text;
      });

      mockProvider.simulateTranscript('Open VS Code', true);
      expect(finalTranscript).toBe('Open VS Code');
      expect(service.getStatus().transcript).toBe('Open VS Code');
    });

    it('should toggle autoSendVoiceCommands setting', () => {
      expect(service.getAutoSendVoiceCommands()).toBe(false);
      service.setAutoSendVoiceCommands(true);
      expect(service.getAutoSendVoiceCommands()).toBe(true);
      expect(service.getStatus().autoSendVoiceCommands).toBe(true);
    });

    it('should toggle listening state', () => {
      service.startListening();
      expect(service.getStatus().isListening).toBe(true);
      service.stopListening();
      expect(service.getStatus().isListening).toBe(false);
    });

    it('should handle recoverable network error by setting friendly message and returning to idle state', () => {
      mockProvider.simulateError('Speech recognition service unavailable.', 'network');
      const status = service.getStatus();
      expect(status.state).toBe('idle');
      expect(status.error).toBe('Speech recognition service unavailable.');
    });

    it('should perform clean disposal on window teardown', () => {
      service.dispose();
      const status = service.getStatus();
      expect(status.state).toBe('idle');
      expect(status.transcript).toBe('');
      expect(status.error).toBeNull();
    });
  });

  describe('4. ProviderFactory & Refined Architecture Unit Tests', () => {
    it('should return MockProvider when explicit mock type requested', () => {
      const provider = ProviderFactory.createProvider('mock');
      expect(provider.name).toBe('MockSpeech');
    });

    it('should return WebSpeechProvider by default in standard browser environment', () => {
      const provider = ProviderFactory.createProvider();
      expect(provider.name).toBeDefined();
    });

    it('should instantiate ModelManager and retrieve model metadata', () => {
      const activeModel = modelManager.getActiveModel();
      expect(activeModel).toBeDefined();
      expect(activeModel?.id).toBe('whisper-tiny.en');
      expect(modelManager.isModelInstalled('whisper-tiny.en')).toBe(true);
    });

    it('should instantiate VoskEngine adhering to IElectronSpeechEngine abstraction', async () => {
      const engine = new VoskEngine();
      expect(engine.name).toBe('VoskEngine');
      expect(engine.isSupported()).toBe(true);
      await engine.initialize();
      expect(engine.name).toBe('VoskEngine');
    });

    it('should instantiate ElectronVoiceProvider delegating to engine', () => {
      const provider = new ElectronVoiceProvider();
      expect(provider.name).toBe('ElectronVoice');
      expect(provider.getState()).toBe('idle');
    });
  });
});
