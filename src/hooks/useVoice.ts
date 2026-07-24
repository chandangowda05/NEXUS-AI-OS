/**
 * NEXUS AI OS — useVoice Custom React Hook
 *
 * Exposes reactive Voice Engine status and clean action bindings to React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { voiceService } from '../services/voiceService';
import { VoiceStatus, VoiceOptions } from '../types/voice';

export function useVoice() {
  const [status, setStatus] = useState<VoiceStatus>(voiceService.getStatus());

  useEffect(() => {
    const unsubscribe = voiceService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const startListening = useCallback((lang?: string) => {
    voiceService.startListening(lang);
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
  }, []);

  const toggleListening = useCallback((lang?: string) => {
    voiceService.toggleListening(lang);
  }, []);

  const speak = useCallback((text: string, options?: VoiceOptions) => {
    return voiceService.speak(text, options);
  }, []);

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking();
  }, []);

  const setAutoSend = useCallback((enabled: boolean) => {
    voiceService.setAutoSendVoiceCommands(enabled);
  }, []);

  return {
    status,
    state: status.state,
    isListening: status.isListening,
    isSpeaking: status.isSpeaking,
    transcript: status.transcript,
    interimTranscript: status.interimTranscript,
    activeTranscript: status.interimTranscript || status.transcript,
    error: status.error,
    micPermission: status.micPermission,
    queueCount: status.queueCount,
    providerType: status.providerType,
    autoSendVoiceCommands: status.autoSendVoiceCommands,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    setAutoSend,
  };
}

export default useVoice;
