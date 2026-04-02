/**
 * Structured stderr logger.
 *
 * MCP protocol reserves stdout exclusively for JSON-RPC messages.
 * All logging MUST go to stderr. Never use console.log in this project.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

interface LogEntry {
  level: LogLevel;
  ts: string;
  msg: string;
  [key: string]: unknown;
}

function write(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  if (!shouldLog(level)) {
    return;
  }
  const entry: LogEntry = { level, ts: new Date().toISOString(), msg, ...data };
  process.stderr.write(JSON.stringify(entry) + '\n');
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[resolveLogLevel()];
}

function resolveLogLevel(): LogLevel {
  const configured = process.env['LOG_LEVEL']?.trim().toLowerCase();
  if (configured === 'debug' || configured === 'info' || configured === 'warn' || configured === 'error') {
    return configured;
  }

  return 'info';
}

export const log = {
  debug(msg: string, data?: Record<string, unknown>): void {
    write('debug', msg, data);
  },
  info(msg: string, data?: Record<string, unknown>): void {
    write('info', msg, data);
  },
  warn(msg: string, data?: Record<string, unknown>): void {
    write('warn', msg, data);
  },
  error(msg: string, data?: Record<string, unknown>): void {
    write('error', msg, data);
  },
};
