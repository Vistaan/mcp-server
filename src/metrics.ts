import { log } from './logger.js';

type MetricTags = Record<string, string | number | boolean | undefined>;

const counters = new Map<string, number>();

export const metrics = {
  increment(name: string, tags?: MetricTags): void {
    const key = metricKey(name, tags);
    counters.set(key, (counters.get(key) ?? 0) + 1);
    if (typeof log.debug === 'function') {
      log.debug('metric.increment', { name, value: counters.get(key), tags });
    }
  },
  observeDuration(name: string, durationMs: number, tags?: MetricTags): void {
    if (typeof log.debug === 'function') {
      log.debug('metric.duration', { name, duration_ms: durationMs, tags });
    }
  },
  reset(): void {
    counters.clear();
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
