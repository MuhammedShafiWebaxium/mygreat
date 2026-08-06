import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { createStaffSchema, updateStaffSchema } from '@/features/auth/auth.schema'
import { assignStudentToPartner, createStaffUser, listAssignmentOptions, listStaffUsers, listStudentUsers, listUniversityPrograms, readDocumentReviewQueue, readPrimaryApplicationQueue, readStaffQueue, updateStaffUser } from '@/features/admin/admin.server'
import { apiError } from '@/lib/api'
import { listPartnerApplications, reviewPartner } from '@/features/partners/partner.server'
import { partnerReviewSchema } from '@/features/partners/partner.schema'
import { assignStudentSchema } from '@/features/workflow/workflow.schema'
import { countrySchema, courseSchema, deleteSchema, feeSchema, universitySchema } from '@/features/university-management/university.schema'
import { deleteEntity, listCatalog, saveCountry, saveCourse, saveUniversity, setCourseFee } from '@/features/university-management/university.server'
import { createCourseImportJob, listImportErrors, listImportJobs, processCourseImportBatch, readImportJob } from '@/features/university-management/import.server'
import { readExchangeRateSettings, refreshExchangeRates } from '@/features/exchange-rates/exchange-rates.server'
import { deleteRequiredDocumentSetting, listRequiredDocumentSettings, requiredDocumentSettingSchema, saveRequiredDocumentSetting, seedDefaultCountryChecklists } from '@/features/required-documents/required-documents.server'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    const user = await requireUser()
    const action = new URL(request.url).searchParams.get('action')
    if (action === 'universityCatalog') {
      assertRole(user.role, ['SUPER_ADMIN'])
      return Response.json(await listCatalog())
    }
    if (action === 'catalogImportJobs') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await listImportJobs(user.id)) }
    if (action === 'exchangeRates') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await readExchangeRateSettings()) }
    if (action === 'requiredDocuments') { assertRole(user.role,['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE']); return Response.json(await listRequiredDocumentSettings()) }
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
    if (action === 'universityPrograms') {
      assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE'])
      const universityId = new URL(request.url).searchParams.get('universityId')
      if (!universityId) return Response.json({ error: 'University is required.' }, { status: 400 })
      return Response.json(await listUniversityPrograms(universityId))
    }
    assertRole(user.role, ['SUPER_ADMIN', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'RECEPTION_EXECUTIVE'])
    if (action === 'students') return Response.json(await listStudentUsers(user))
    if (action === 'queue') return Response.json(await readStaffQueue(user))
    if (action === 'primaryApplications') return Response.json(await readPrimaryApplicationQueue(user))
    if (action === 'documentReviews') return Response.json(await readDocumentReviewQueue(user))
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
    if (action === 'createCourseImportJob') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await createCourseImportJob(user.id,String(body.fileName),Number(body.totalRows))) }
    if (action === 'processCourseImportBatch') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await processCourseImportBatch(user.id,String(body.jobId),Number(body.startRow),body.rows)) }
    if (action === 'readCatalogImportJob') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await readImportJob(user.id,String(body.jobId))) }
    if (action === 'catalogImportErrors') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await listImportErrors(user.id,String(body.jobId))) }
    if (action === 'saveCountry') { assertRole(user.role, ['SUPER_ADMIN']); return Response.json(await saveCountry(user.id, countrySchema.parse(body))) }
    if (action === 'saveUniversity') { assertRole(user.role, ['SUPER_ADMIN']); return Response.json(await saveUniversity(user.id, universitySchema.parse(body))) }
    if (action === 'saveCourse') { assertRole(user.role, ['SUPER_ADMIN']); return Response.json(await saveCourse(user.id, courseSchema.parse(body))) }
    if (action === 'setCourseFee') { assertRole(user.role, ['SUPER_ADMIN']); return Response.json(await setCourseFee(user.id, feeSchema.parse(body))) }
    if (action === 'deleteCatalogEntity') { assertRole(user.role, ['SUPER_ADMIN']); const parsed = deleteSchema.parse(body); return Response.json(await deleteEntity(user.id, parsed.entity, parsed.id)) }
    if (action === 'refreshExchangeRates') { assertRole(user.role,['SUPER_ADMIN']); return Response.json(await refreshExchangeRates(user.id)) }
    if (action === 'saveRequiredDocument') { assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE']); return Response.json(await saveRequiredDocumentSetting(requiredDocumentSettingSchema.parse(body))) }
    if (action === 'deleteRequiredDocument') { assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE']); const {id}=z.object({id:z.string().min(1)}).parse(body); return Response.json(await deleteRequiredDocumentSetting(id)) }
    if (action === 'seedDefaultCountryChecklists') { assertRole(user.role, ['SUPER_ADMIN', 'PARTNER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE', 'MARKETING_EXECUTIVE', 'FINANCE_EXECUTIVE', 'SUPPORT_EXECUTIVE']); return Response.json(await seedDefaultCountryChecklists()) }
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
