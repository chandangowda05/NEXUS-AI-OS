import { app, BrowserWindow, ipcMain, session } from 'electron';
import path from 'path';
import { getSystemMetrics } from './services/systemInfo';
import { executeDesktopCommand } from './services/desktopControl';
import { initDatabase, getDb } from './services/db';
import { agentManager } from './agents/AgentManager';
import { voiceMainService } from './services/VoiceMainService';

let mainWindow: BrowserWindow | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'JARVIS-X | Project Phoenix (NEXUS)',
    frame: true,
    backgroundColor: '#060911',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  });

  voiceMainService.setTargetWindow(mainWindow);

  // Load Vite Dev Server URL or Production dist
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    voiceMainService.dispose();
    mainWindow = null;
    if (metricsInterval) clearInterval(metricsInterval);
  });

  // Start System Metrics Stream
  metricsInterval = setInterval(async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const metrics = await getSystemMetrics();
      mainWindow.webContents.send('system-metrics-update', metrics);
    }
  }, 2000);
}

app.whenReady().then(() => {
  // Check 5: Diagnostic logs for Electron Main process
  console.log('[Electron Main Diagnostics] Electron Version:', process.versions.electron);
  console.log('[Electron Main Diagnostics] Chromium Version:', process.versions.chrome);

  // Check 2 & 5: Temporary Permission Request Handler with diagnostic logging
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    console.log(`[Electron Main Diagnostics] Permission requested: "${permission}"`, details);
    if (permission === 'media' || (permission as string) === 'microphone') {
      console.log(`[Electron Main Diagnostics] Granting permission: "${permission}"`);
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    console.log(`[Electron Main Diagnostics] Permission check: "${permission}" from ${requestingOrigin}`);
    return permission === 'media' || (permission as string) === 'microphone';
  });

  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  voiceMainService.dispose();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler Registrations
ipcMain.handle('get-system-metrics', async () => {
  return await getSystemMetrics();
});

ipcMain.handle('execute-desktop-command', async (_event, commandType: string, payload?: any) => {
  return await executeDesktopCommand(commandType, payload);
});

ipcMain.handle('process-user-request', async (_event, prompt: string) => {
  return await agentManager.handleUserRequest(prompt, {
    userId: 'user-1',
    sessionId: 'session-local',
    workingDirectory: 'g:/jarvis'
  });
});

ipcMain.handle('get-db-data', async (_event, table: string) => {
  const db = getDb();
  if (!db) return [];
  try {
    const stmt = db.prepare(`SELECT * FROM ${table}`);
    return stmt.all();
  } catch (err) {
    console.error(`Error querying table ${table}:`, err);
    return [];
  }
});

ipcMain.handle('save-preference', async (_event, key: string, value: string) => {
  const db = getDb();
  if (!db) return false;
  try {
    const stmt = db.prepare('INSERT INTO preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    stmt.run(key, value);
    return true;
  } catch (err) {
    console.error('Error saving preference:', err);
    return false;
  }
});

// Voice Pipeline IPC Wiring
ipcMain.handle('voice:start', async (_event, lang?: string) => {
  console.log('[Electron Main IPC] voice:start requested', { lang });
  return await voiceMainService.startSession(lang);
});

ipcMain.handle('voice:stop', async () => {
  console.log('[Electron Main IPC] voice:stop requested');
  await voiceMainService.stopSession();
  return true;
});

ipcMain.on('voice:audio-chunk', (_event, buffer: ArrayBuffer) => {
  voiceMainService.handleAudioChunk(buffer);
});
ipcMain.on('voice:audio-chunk', (_event, buffer: ArrayBuffer) => {
  console.log('[Electron Main IPC] Received audio chunk:', buffer.byteLength);
  voiceMainService.handleAudioChunk(buffer);
});
