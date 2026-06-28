// CloudWatch EMF metrics for the render server (mirror of lib/metrics.ts).
// One structured JSON line per metric → CloudWatch auto-extracts it under the
// "AquaStudio" namespace. No agent or PutMetricData call required.
export const METRICS_NAMESPACE = "AquaStudio";

const ENVIRONMENT = process.env.NODE_ENV || "development";

export function metric(name, value = 1, unit = "Count", extra = {}) {
  const line = {
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [
        {
          Namespace: METRICS_NAMESPACE,
          Dimensions: [["Environment"]],
          Metrics: [{ Name: name, Unit: unit }],
        },
      ],
    },
    Environment: ENVIRONMENT,
    [name]: value,
    ...extra,
  };
  console.log(JSON.stringify(line));
}

// Time an async op: emits `<name>` (Milliseconds) on success, `Errors` on throw.
export async function timed(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    metric(name, Date.now() - start, "Milliseconds");
    return result;
  } catch (err) {
    metric("Errors", 1, "Count", { op: name });
    throw err;
  }
}
