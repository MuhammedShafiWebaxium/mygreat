import { NextResponse } from 'next/server'
import { getSessionUser } from '@/features/auth/session.server'
import { apiError } from '@/lib/api'

export async function GET() {
  try {
    return NextResponse.json(await getSessionUser())
  } catch (error) {
    return apiError(error)
  }
}
