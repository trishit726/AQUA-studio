/**
 * CloudWatch metrics via EMF (Embedded Metric Format).
 *
 * Writing a single structured JSON line to stdout in EMF shape causes CloudWatch
 * to extract a metric automatically — no agent, no PutMetricData call, no extra
 * infrastructure. On Vercel the same line is just a structured log you can grep;
 * on Lambda/ECS with the CloudWatch log driver it becomes a real metric under
 * the "AquaStudio" namespace (see terraform/observability.tf for the dashboard
 * and alarms that read it).
 *
 * Reference: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format_Specification.html
 */

export const METRICS_NAMESPACE = "AquaStudio"

const ENVIRONMENT =
  process.env.VERCEL_ENV || process.env.NODE_ENV || "development"

type Unit = "Count" | "Milliseconds" | "Bytes" | "None"

/** Emit one EMF metric line. `extra` adds non-metric context fields (logged, not graphed). */
export function metric(
  name: string,
  value = 1,
  unit: Unit = "Count",
  extra: Record<string, string | number> = {},
): void {
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
  }
  // One line so CloudWatch parses it as a single EMF event.
  console.log(JSON.stringify(line))
}

/**
 * Time an async operation: emits `<name>` (Milliseconds) on success, or an
 * `Errors` count (tagged with the op) on throw. Re-raises so callers handle the
 * error as before — instrumentation never changes behaviour.
 */
export async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    metric(name, Date.now() - start, "Milliseconds")
    return result
  } catch (err) {
    metric("Errors", 1, "Count", { op: name })
    throw err
  }
}
