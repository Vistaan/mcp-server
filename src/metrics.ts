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
  toPrometheus(): string {
    const snapshot = this.snapshot();
    const lines: string[] = [];

    for (const [key, value] of Object.entries(snapshot.counters)) {
      const { name, tags } = parseMetricKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(formatPrometheusMetric(name, tags, value));
    }

    for (const [key, value] of Object.entries(snapshot.durations)) {
      const { name, tags } = parseMetricKey(key);
      const baseName = `${name}_ms`;
      lines.push(`# TYPE ${baseName}_count gauge`);
      lines.push(formatPrometheusMetric(`${baseName}_count`, tags, value.count));
      lines.push(formatPrometheusMetric(`${baseName}_total`, tags, value.total_ms));
      lines.push(formatPrometheusMetric(`${baseName}_avg`, tags, value.avg_ms));
      lines.push(formatPrometheusMetric(`${baseName}_min`, tags, value.min_ms));
      lines.push(formatPrometheusMetric(`${baseName}_max`, tags, value.max_ms));
    }

    return lines.join('\n');
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

function parseMetricKey(key: string): { name: string; tags: Record<string, string> } {
  const [rawName, tagList] = key.split('|', 2);
  const name = rawName ?? 'metric';
  const tags: Record<string, string> = {};
  if (!tagList) {
    return { name: sanitizeMetricName(name), tags };
  }

  for (const pair of tagList.split('|')) {
    const [tagKey, ...rest] = pair.split(':');
    if (!tagKey || rest.length === 0) {
      continue;
    }
    tags[sanitizeMetricLabel(tagKey)] = rest.join(':');
  }

  return { name: sanitizeMetricName(name), tags };
}

function sanitizeMetricName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_:]/g, '_');
}

function sanitizeMetricLabel(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, '_');
}

function formatPrometheusMetric(name: string, tags: Record<string, string>, value: number): string {
  const tagEntries = Object.entries(tags);
  if (tagEntries.length === 0) {
    return `${name} ${String(value)}`;
  }

  const serializedTags = tagEntries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, tagValue]) => `${key}="${escapePrometheusLabelValue(tagValue)}"`)
    .join(',');

  return `${name}{${serializedTags}} ${String(value)}`;
}

function escapePrometheusLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
