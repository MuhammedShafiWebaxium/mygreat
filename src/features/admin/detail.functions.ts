import { createServerFn } from '@tanstack/react-start'
import { getSessionUser } from '@/features/auth/session.server'
import { readPartnerProfileForStaff, readStudentProfileForStaff } from './admin.server'

export const getStudentDetailFn = createServerFn({ method: 'GET', strict: false })
  .validator((studentId: string) => studentId)
  .handler(async ({ data: studentId }) => {
    const user = await getSessionUser()
    if (!user || user.accountType === 'STUDENT') throw new Error('Authentication required.')
    return readStudentProfileForStaff(user, studentId)
  })

export const getPartnerDetailFn = createServerFn({ method: 'GET', strict: false })
  .validator((partnerCompanyId: string) => partnerCompanyId)
  .handler(async ({ data: partnerCompanyId }) => {
    const user = await getSessionUser()
    if (!user || user.accountType !== 'ADMIN') throw new Error('Authentication required.')
    return readPartnerProfileForStaff(user, partnerCompanyId)
  })
