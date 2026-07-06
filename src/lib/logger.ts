/**
 * Tiny structured server-side logger.
 * Emits single-line JSON to stdout/stderr with timestamp and scope.
 * NEVER log user-facing messages; log the verbose detail server-side only.
 */

type Level = "error" | "warn" | "info";
type Meta = Record<string, unknown>;

function emit(level: Level, scope: string, message: string, meta?: Meta): void {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
  };
  if (meta !== undefined) entry.meta = meta;

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  error: (scope: string, message: string, meta?: Meta) => emit("error", scope, message, meta),
  warn:  (scope: string, message: string, meta?: Meta) => emit("warn",  scope, message, meta),
  info:  (scope: string, message: string, meta?: Meta) => emit("info",  scope, message, meta),
};
