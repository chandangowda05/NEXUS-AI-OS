import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  executeCommand: (commandType: string, payload?: any) => ipcRenderer.invoke('execute-desktop-command', commandType, payload),
  processUserRequest: (prompt: string) => ipcRenderer.invoke('process-user-request', prompt),
  getDbData: (table: string) => ipcRenderer.invoke('get-db-data', table),
  savePreference: (key: string, value: string) => ipcRenderer.invoke('save-preference', key, value),
  onMetricsUpdate: (callback: (metrics: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('system-metrics-update', subscription);
    return () => ipcRenderer.removeListener('system-metrics-update', subscription);
  },
  voice: {
    start: (lang?: string) => ipcRenderer.invoke('voice:start', lang),
    stop: () => ipcRenderer.invoke('voice:stop'),
    sendAudioChunk: (buffer: ArrayBuffer) => ipcRenderer.send('voice:audio-chunk', buffer),
    onTranscript: (callback: (data: { text: string; isFinal: boolean }) => void) => {
      const subscription = (_event: any, data: { text: string; isFinal: boolean }) => callback(data);
      ipcRenderer.on('voice:transcript', subscription);
      return () => ipcRenderer.removeListener('voice:transcript', subscription);
    },
    onError: (callback: (data: { message: string; code?: string }) => void) => {
      const subscription = (_event: any, data: { message: string; code?: string }) => callback(data);
      ipcRenderer.on('voice:error', subscription);
      return () => ipcRenderer.removeListener('voice:error', subscription);
    },
    onStateChanged: (callback: (state: string) => void) => {
      const subscription = (_event: any, state: string) => callback(state);
      ipcRenderer.on('voice:state', subscription);
      return () => ipcRenderer.removeListener('voice:state', subscription);
    }
    
  }
});
