import "server-only"

type LogContext = Record<string, boolean | number | string | null | undefined>

function write(level: "error" | "warn", event: string, context: LogContext) {
  const entry = JSON.stringify({
    level,
    event,
    ...Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined)),
  })
  console[level](entry)
}

export function logServerError(event: string, context: LogContext = {}) {
  write("error", event, context)
}

export function logServerWarning(event: string, context: LogContext = {}) {
  write("warn", event, context)
}
