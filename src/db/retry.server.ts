import '@tanstack/react-start/server-only'

const RETRY_DELAYS_MS = [250, 750, 1_500, 3_000]

function isTransientDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false
  const details = error as Error & { code?: string; meta?: { code?: string; message?: string } }
  const code = details.meta?.code ?? details.code
  const message = `${details.message} ${details.meta?.message ?? ''}`.toLowerCase()
  return ['57P03', 'P1001', 'P1002', 'P1017', 'ECONNRESET'].includes(code ?? '')
    || message.includes('57p03')
    || message.includes('database system is in recovery mode')
    || message.includes('server has closed the connection')
    || message.includes('connection terminated unexpectedly')
    || message.includes('connection reset')
}

export async function withDatabaseRecoveryRetry<T>(operation: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      const delay = RETRY_DELAYS_MS[attempt]
      if (delay === undefined || !isTransientDatabaseError(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
