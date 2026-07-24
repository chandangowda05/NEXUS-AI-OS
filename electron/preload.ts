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
  }
});
