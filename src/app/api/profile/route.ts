import { NextResponse } from 'next/server'
import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { onboardingSchema } from '@/features/profile/profile.schema'
import { readStudentProfile, writeStudentProfile } from '@/features/profile/profile.server'
import { apiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireUser()
    assertRole(user.role, ['STUDENT'])
    return NextResponse.json(await readStudentProfile(user.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser()
    assertRole(user.role, ['STUDENT'])
    return NextResponse.json(await writeStudentProfile(user.id, onboardingSchema.parse(await request.json())))
  } catch (error) {
    return apiError(error)
  }
}
