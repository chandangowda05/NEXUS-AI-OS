/**
 * NEXUS AI Operating System
 * Logger Utility — Production-level structured logging module
 *
 * Responsibilities:
 *  - Consistent [TIMESTAMP] [LEVEL] [MODULE] format across all services
 *  - Log levels: debug, info, warn, error
 *  - Respects LOG_LEVEL environment variable
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.VITE_LOG_LEVEL as LogLevel) || 'info';

function formatMessage(level: LogLevel, module: string, message: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase().padEnd(5)}] [${module}] ${message}`;
  return data !== undefined ? `${base} ${JSON.stringify(data)}` : base;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

export const Logger = {
  debug(module: string, message: string, data?: unknown): void {
    if (shouldLog('debug')) console.debug(formatMessage('debug', module, message, data));
  },
  info(module: string, message: string, data?: unknown): void {
    if (shouldLog('info')) console.info(formatMessage('info', module, message, data));
  },
  warn(module: string, message: string, data?: unknown): void {
    if (shouldLog('warn')) console.warn(formatMessage('warn', module, message, data));
  },
  error(module: string, message: string, data?: unknown): void {
    if (shouldLog('error')) console.error(formatMessage('error', module, message, data));
  },
};
