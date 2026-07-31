import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { createStaffSchema, updateStaffSchema } from '@/features/auth/auth.schema'
import { assignStudentToPartner, createStaffUser, listAssignmentOptions, listStaffUsers, listStudentUsers, readPrimaryApplicationQueue, readStaffQueue, updateStaffUser } from '@/features/admin/admin.server'
import { apiError } from '@/lib/api'
import { listPartnerApplications, reviewPartner } from '@/features/partners/partner.server'
import { partnerReviewSchema } from '@/features/partners/partner.schema'
import { assignStudentSchema } from '@/features/workflow/workflow.schema'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const action = new URL(request.url).searchParams.get('action')
    if (action === 'listStaff') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN'])
      return Response.json(await listStaffUsers(user))
    }
    if (action === 'partners') {
      assertRole(user.role, ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE'])
      return Response.json(await listPartnerApplications())
    }
    if (action === 'assignmentOptions') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE'])
      return Response.json(await listAssignmentOptions(user))
    }
    assertRole(user.role, ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'RECEPTION_EXECUTIVE'])
    if (action === 'students') return Response.json(await listStudentUsers(user))
    if (action === 'queue') return Response.json(await readStaffQueue(user))
    if (action === 'primaryApplications') return Response.json(await readPrimaryApplicationQueue(user))
    return Response.json({ error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const action = new URL(request.url).searchParams.get('action')
    const body = await request.json()
    if (action === 'createStaff') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN'])
      return Response.json(await createStaffUser(user, createStaffSchema.parse(body)))
    }
    if (action === 'updateStaff') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN'])
      return Response.json(await updateStaffUser(user, updateStaffSchema.parse(body)))
    }
    if (action === 'reviewPartner') {
      assertRole(user.role, ['SUPER_ADMIN'])
      return Response.json(await reviewPartner(user.id, partnerReviewSchema.parse(body)))
    }
    if (action === 'assignStudent') {
      assertRole(user.role, ['SUPER_ADMIN'])
      return Response.json(await assignStudentToPartner(user.id, assignStudentSchema.parse(body)))
    }
    return Response.json({ error: 'Unknown admin action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}
