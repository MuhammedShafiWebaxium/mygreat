import { NextResponse } from 'next/server'
import { accountSchema } from '@/features/auth/auth.schema'
import { updateAccount } from '@/features/auth/auth.server'
import { requireUser } from '@/features/auth/authorization.server'
import { apiError } from '@/lib/api'

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    if (user.accountType !== 'STUDENT') throw new Error('Student authentication required.')
    return NextResponse.json(await updateAccount(user.id, accountSchema.parse(await request.json())))
  } catch (error) {
    return apiError(error)
  }
}
