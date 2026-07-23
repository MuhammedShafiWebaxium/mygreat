import { NextResponse } from 'next/server'
import { loginSchema } from '@/features/auth/auth.schema'
import { authenticate } from '@/features/auth/auth.server'
import { apiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    return NextResponse.json(await authenticate(loginSchema.parse(await request.json())))
  } catch (error) {
    return apiError(error)
  }
}
