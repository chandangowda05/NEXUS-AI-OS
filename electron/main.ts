import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { getSystemMetrics } from './services/systemInfo';
import { executeDesktopCommand } from './services/desktopControl';
import { initDatabase, getDb } from './services/db';
import { agentManager } from './agents/AgentManager';

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

  // Load Vite Dev Server URL or Production dist
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
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
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
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
