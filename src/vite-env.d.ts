/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getSystemMetrics: () => Promise<any>;
    executeCommand: (commandType: string, payload?: any) => Promise<any>;
    processUserRequest: (prompt: string) => Promise<any>;
    getDbData: (table: string) => Promise<any[]>;
    savePreference: (key: string, value: string) => Promise<boolean>;
    onMetricsUpdate: (callback: (metrics: any) => void) => () => void;
  };
}
