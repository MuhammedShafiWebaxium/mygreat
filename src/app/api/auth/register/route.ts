import { NextResponse } from 'next/server'
import { registerSchema } from '@/features/auth/auth.schema'
import { registerStudent } from '@/features/auth/auth.server'
import { apiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    return NextResponse.json(await registerStudent(registerSchema.parse(await request.json())))
  } catch (error) {
    return apiError(error)
  }
}
