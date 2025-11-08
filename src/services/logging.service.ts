/**
 * Production-ready logging service with proper levels and formatting
 * Replaces console.log/warn/error statements throughout the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogContext =
  | 'app'
  | 'agent'
  | 'auth'
  | 'database'
  | 'websocket'
  | 'api'
  | 'ui';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

export class LoggingService {
  private static instance: LoggingService;
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogEntries = 1000;

  private constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public debug(
    context: LogContext,
    message: string,
    data?: any,
    meta?: { userId?: string; sessionId?: string }
  ): void {
    this.log('debug', context, message, data, undefined, meta);
  }

  public info(
    context: LogContext,
    message: string,
    data?: any,
    meta?: { userId?: string; sessionId?: string }
  ): void {
    this.log('info', context, message, data, undefined, meta);
  }

  public warn(
    context: LogContext,
    message: string,
    data?: any,
    meta?: { userId?: string; sessionId?: string }
  ): void {
    this.log('warn', context, message, data, undefined, meta);
  }

  public error(
    context: LogContext,
    message: string,
    error?: Error,
    data?: any,
    meta?: { userId?: string; sessionId?: string }
  ): void {
    this.log('error', context, message, data, error, meta);
  }

  // Legacy method aliases for compatibility
  public async logInfo(message: string, data?: any): Promise<void> {
    this.info('app', message, data);
  }

  public async logError(message: string, data?: any): Promise<void> {
    this.error('app', message, undefined, data);
  }

  private log(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: any,
    error?: Error,
    meta?: { userId?: string; sessionId?: string }
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(data !== undefined && { data }),
      ...(error !== undefined && { error }),
      ...(meta?.userId !== undefined && { userId: meta.userId }),
      ...(meta?.sessionId !== undefined && { sessionId: meta.sessionId }),
    };

    // Store in memory (for debugging and potential sending to logging service)
    this.addToMemory(logEntry);

    // Output to console in development or for errors
    if (this.isDevelopment || level === 'error') {
      this.outputToConsole(logEntry);
    }

    // In production, you would send logs to a service like LogRocket, Sentry, etc.
    if (!this.isDevelopment && level === 'error') {
      this.sendToLoggingService(logEntry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private addToMemory(logEntry: LogEntry): void {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  private outputToConsole(logEntry: LogEntry): void {
    const prefix = `[${logEntry.timestamp}] [${logEntry.context.toUpperCase()}]`;
    const message = `${prefix} ${logEntry.message}`;

    switch (logEntry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(message, logEntry.data);
        }
        break;
      case 'info':
        console.log(message, logEntry.data);
        break;
      case 'warn':
        console.warn(message, logEntry.data);
        break;
      case 'error':
        console.error(message, logEntry.error || logEntry.data);
        if (logEntry.error) {
          console.error(logEntry.error.stack);
        }
        break;
    }
  }

  private sendToLoggingService(logEntry: LogEntry): void {
    // In a real application, you would send this to a logging service
    // For now, we'll just prepare the structure
    try {
      // Example: Send to external logging service
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to external service:', error);
      this.outputToConsole(logEntry);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public getLogLevel(): LogLevel {
    return this.logLevel;
  }
}

// Export singleton instance
export const logger = LoggingService.getInstance();

// Convenience functions for common use cases
export const logDebug = (context: LogContext, message: string, data?: any) =>
  logger.debug(context, message, data);
export const logInfo = (context: LogContext, message: string, data?: any) =>
  logger.info(context, message, data);
export const logWarn = (context: LogContext, message: string, data?: any) =>
  logger.warn(context, message, data);
export const logError = (
  context: LogContext,
  message: string,
  error?: Error,
  data?: any
) => logger.error(context, message, error, data);
