import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function apiError(error: unknown) {
  const message = error instanceof ZodError
    ? error.issues[0]?.message ?? 'Invalid request.'
    : error instanceof Error
      ? error.message
      : 'Unexpected server error.'
  const status = message === 'Authentication required.' ? 401
    : message.startsWith('This action requires') ? 403
      : error instanceof ZodError ? 400 : 500
  return NextResponse.json({ error: message }, { status })
}
