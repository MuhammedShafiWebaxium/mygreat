import { NextResponse } from 'next/server'
import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { createStaffSchema, updateStaffSchema } from '@/features/auth/auth.schema'
import { createStaffUser, listStaffUsers, listStudentUsers, readStaffQueue, updateStaffUser } from '@/features/admin/admin.server'
import { apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const action = new URL(request.url).searchParams.get('action')
    if (action === 'listStaff') {
      assertRole(user.role, ['SUPER_ADMIN'])
      return NextResponse.json(await listStaffUsers())
    }
    assertRole(user.role, ['SUPER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE'])
    if (action === 'students') return NextResponse.json(await listStudentUsers(user))
    if (action === 'queue') return NextResponse.json(await readStaffQueue(user))
    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    assertRole(user.role, ['SUPER_ADMIN'])
    const action = new URL(request.url).searchParams.get('action')
    const body = await request.json()
    if (action === 'createStaff') return NextResponse.json(await createStaffUser(user.id, createStaffSchema.parse(body)))
    if (action === 'updateStaff') return NextResponse.json(await updateStaffUser(user.id, updateStaffSchema.parse(body)))
    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}
