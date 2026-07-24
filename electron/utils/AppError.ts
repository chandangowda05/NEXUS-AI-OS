/**
 * NEXUS AI Operating System
 * AppError Utility — Typed error classes for structured exception handling
 */

export enum ErrorCode {
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  DB_WRITE_FAILED = 'DB_WRITE_FAILED',
  DB_READ_FAILED = 'DB_READ_FAILED',
  MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
  AGENT_TIMEOUT = 'AGENT_TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly module: string;
  public readonly context?: unknown;

  constructor(code: ErrorCode, module: string, message: string, context?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.module = module;
    this.context = context;

    // Preserves proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      module: this.module,
      message: this.message,
      context: this.context,
    };
  }
}
