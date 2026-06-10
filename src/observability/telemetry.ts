import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import type { Span, SpanAttributes } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK, tracing } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { env } from "../config/env.ts";

let sdk: NodeSDK | undefined;
let shuttingDown = false;

function createTraceExporter() {
  const hasOtlpEndpoint = Boolean(
    env.otel.exporterOtlpEndpoint || env.otel.exporterOtlpTracesEndpoint
  );

  if (hasOtlpEndpoint || env.otel.tracesExporter === "otlp") {
    return new OTLPTraceExporter();
  }

  if (env.otel.tracesExporter === "console") {
    return new tracing.ConsoleSpanExporter();
  }

  return undefined;
}

export function startTelemetry() {
  if (sdk) {
    return sdk;
  }

  const traceExporter = createTraceExporter();

  if (!traceExporter) {
    process.env.OTEL_TRACES_EXPORTER ??= "none";
    process.env.OTEL_METRICS_EXPORTER ??= "none";
    process.env.OTEL_LOGS_EXPORTER ??= "none";
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.otel.serviceName,
    }),
    ...(traceExporter ? { traceExporter } : {}),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  return sdk;
}

export async function shutdownTelemetry() {
  if (!sdk || shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await sdk.shutdown();
  } finally {
    sdk = undefined;
    shuttingDown = false;
  }
}

export async function withSpan<T>(
  name: string,
  attributes: SpanAttributes,
  callback: (span: Span) => Promise<T>
) {
  startTelemetry();
  const tracer = trace.getTracer(env.otel.serviceName);

  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await callback(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      span.recordException(error instanceof Error ? error : message);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function recordEvent(name: string, attributes: SpanAttributes = {}) {
  trace.getActiveSpan()?.addEvent(name, attributes);
}

export function recordAttributes(attributes: SpanAttributes) {
  trace.getActiveSpan()?.setAttributes(attributes);
}

export function traceInfrastructure<T>(
  operation: string,
  callback: () => Promise<T>
) {
  return withSpan(`infrastructure.${operation}`, { "research.operation": operation }, callback);
}
