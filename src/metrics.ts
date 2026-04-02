import { log } from './logger.js';

type MetricTags = Record<string, string | number | boolean | undefined>;

const counters = new Map<string, number>();
const durations = new Map<string, { count: number; totalMs: number; minMs: number; maxMs: number }>();

export type MetricsSnapshot = {
  counters: Record<string, number>;
  durations: Record<string, { count: number; total_ms: number; avg_ms: number; min_ms: number; max_ms: number }>;
};

export const metrics = {
  increment(name: string, tags?: MetricTags): void {
    const key = metricKey(name, tags);
    counters.set(key, (counters.get(key) ?? 0) + 1);
    if (typeof log.debug === 'function') {
      log.debug('metric.increment', { name, value: counters.get(key), tags });
    }
  },
  observeDuration(name: string, durationMs: number, tags?: MetricTags): void {
    const key = metricKey(name, tags);
    const current = durations.get(key);
    if (current) {
      current.count += 1;
      current.totalMs += durationMs;
      current.minMs = Math.min(current.minMs, durationMs);
      current.maxMs = Math.max(current.maxMs, durationMs);
    } else {
      durations.set(key, { count: 1, totalMs: durationMs, minMs: durationMs, maxMs: durationMs });
    }
    if (typeof log.debug === 'function') {
      log.debug('metric.duration', { name, duration_ms: durationMs, tags });
    }
  },
  reset(): void {
    counters.clear();
    durations.clear();
  },
  snapshot(): MetricsSnapshot {
    return {
      counters: Object.fromEntries(counters.entries()),
      durations: Object.fromEntries(
        Array.from(durations.entries()).map(([key, value]) => [
          key,
          {
            count: value.count,
            total_ms: Number(value.totalMs.toFixed(2)),
            avg_ms: Number((value.totalMs / value.count).toFixed(2)),
            min_ms: Number(value.minMs.toFixed(2)),
            max_ms: Number(value.maxMs.toFixed(2)),
          },
        ]),
      ),
    };
  },
};

function metricKey(name: string, tags?: MetricTags): string {
  if (!tags) {
    return name;
  }

  const serializedTags = Object.entries(tags)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join('|');

  return serializedTags ? `${name}|${serializedTags}` : name;
}
