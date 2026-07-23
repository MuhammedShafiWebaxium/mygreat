import { NextResponse } from 'next/server'
import { deleteUserSession } from '@/features/auth/session.server'
import { apiError } from '@/lib/api'

export async function POST() {
  try {
    await deleteUserSession()
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
