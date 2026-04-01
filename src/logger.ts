/**
 * Structured stderr logger.
 *
 * MCP protocol reserves stdout exclusively for JSON-RPC messages.
 * All logging MUST go to stderr. Never use console.log in this project.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  ts: string;
  msg: string;
  [key: string]: unknown;
}

function write(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  const entry: LogEntry = { level, ts: new Date().toISOString(), msg, ...data };
  process.stderr.write(JSON.stringify(entry) + '\n');
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
