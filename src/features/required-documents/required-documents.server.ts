import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/db/client.server'
import { z } from 'zod'
import type { DocumentCategory, DocumentStage } from '@/generated/prisma/client'

export const requiredDocumentSettingSchema = z.object({
  id: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  accept: z.string().trim().min(1).max(255),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000),
  category: z.enum(['PERSONAL', 'ACADEMIC', 'FINANCIAL', 'VISA_COUNTRY']).default('PERSONAL'),
  stage: z.enum(['PROFILE_ONBOARDING', 'APPLICATION_SUBMISSION', 'VISA_PROCESSING']).default('PROFILE_ONBOARDING'),
  countryCode: z.string().trim().max(255).nullable().optional(),
  programLevel: z.string().trim().max(50).nullable().optional(),
  financialType: z.string().trim().max(30).nullable().optional(),
})

export async function listRequiredDocumentSettings(
  activeOnly = false,
  filter?: { stage?: DocumentStage; countryCode?: string | null; category?: DocumentCategory },
) {
  const activeCondition = activeOnly ? Prisma.sql`WHERE active = TRUE` : Prisma.sql`WHERE 1=1`

  const stageCondition = filter?.stage ? Prisma.sql`AND stage = ${filter.stage}::document_stage` : Prisma.sql``
  const categoryCondition = filter?.category ? Prisma.sql`AND category = ${filter.category}::document_category` : Prisma.sql``

  let countryCondition = Prisma.sql``
  if (filter?.countryCode !== undefined) {
    if (filter.countryCode === null || filter.countryCode === '') {
      countryCondition = Prisma.sql`AND (country_code IS NULL OR country_code = '')`
    } else {
      countryCondition = Prisma.sql`AND (country_code IS NULL OR country_code = '' OR country_code LIKE ${'%' + filter.countryCode + '%'})`
    }
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      name: string
      accept: string
      active: boolean
      sortOrder: number
      category: DocumentCategory
      stage: DocumentStage
      countryCode: string | null
      programLevel: string | null
      financialType: string | null
    }>
  >(Prisma.sql`
    SELECT 
      id, 
      name, 
      accept, 
      active, 
      sort_order AS "sortOrder", 
      category, 
      stage, 
      country_code AS "countryCode", 
      program_level AS "programLevel",
      financial_type AS "financialType"
    FROM required_document_settings
    ${activeCondition}
    ${stageCondition}
    ${categoryCondition}
    ${countryCondition}
    ORDER BY sort_order ASC, name ASC
  `)

  return rows
}

export async function saveRequiredDocumentSetting(input: z.infer<typeof requiredDocumentSettingSchema>) {
  const category = input.category || 'PERSONAL'
  const stage = input.stage || 'PROFILE_ONBOARDING'
  const countryCode = input.countryCode || null
  const programLevel = input.programLevel || 'ALL'
  const financialType = input.financialType || null

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO required_document_settings (
      id, name, accept, active, sort_order, category, stage, country_code, program_level, financial_type, created_at, updated_at
    ) VALUES (
      ${input.id}, ${input.name}, ${input.accept}, ${input.active}, ${input.sortOrder},
      ${category}::document_category, ${stage}::document_stage, ${countryCode}, ${programLevel}, ${financialType}, NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      accept = EXCLUDED.accept,
      active = EXCLUDED.active,
      sort_order = EXCLUDED.sort_order,
      category = EXCLUDED.category,
      stage = EXCLUDED.stage,
      country_code = EXCLUDED.country_code,
      program_level = EXCLUDED.program_level,
      financial_type = EXCLUDED.financial_type,
      updated_at = NOW()
  `)

  const [row] = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT 
      id, 
      name, 
      accept, 
      active, 
      sort_order AS "sortOrder", 
      category, 
      stage, 
      country_code AS "countryCode", 
      program_level AS "programLevel",
      financial_type AS "financialType"
    FROM required_document_settings
    WHERE id = ${input.id}
  `)

  return row
}

export async function deleteRequiredDocumentSetting(id: string) {
  await prisma.$executeRaw(Prisma.sql`DELETE FROM required_document_settings WHERE id = ${id}`)
  return { ok: true }
}

export async function seedDefaultCountryChecklists() {
  const templates: Array<z.infer<typeof requiredDocumentSettingSchema>> = [
    // --- GLOBAL ONBOARDING & ACADEMIC PREREQUISITES ---
    { id: 'passport-doc', name: 'Passport (First & Last Page)', accept: '.pdf,.jpg,.png', active: true, sortOrder: 10, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: 'photo-doc', name: 'Passport Size Photo', accept: '.jpg,.jpeg,.png', active: true, sortOrder: 15, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: 'aadhaar-doc', name: 'Aadhaar Card', accept: '.pdf,.jpg,.png', active: true, sortOrder: 20, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: '10th-marksheet', name: '10th Standard Marksheet / Certificate', accept: '.pdf', active: true, sortOrder: 30, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: '12th-marksheet', name: '12th Standard Marksheet / Certificate', accept: '.pdf', active: true, sortOrder: 35, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: 'bachelor-degree', name: 'Bachelor Degree Certificate / Transcripts', accept: '.pdf', active: true, sortOrder: 40, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null },
    { id: 'lor-letter', name: 'Letter of Recommendation (LOR)', accept: '.pdf,.doc,.docx', active: true, sortOrder: 45, category: 'ACADEMIC', stage: 'APPLICATION_SUBMISSION', countryCode: null },

    // --- MULTI-COUNTRY SHARED REQUIREMENTS ---
    { id: 'ielts-cert', name: 'IELTS / English Test Certificate', accept: '.pdf', active: true, sortOrder: 50, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: 'GBR,CAN,IRL,NZL,AUS,USA' },
    { id: 'visa-sop', name: 'Visa SOP / Statement of Purpose', accept: '.pdf,.doc,.docx', active: true, sortOrder: 60, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL,NZL' },
    { id: 'visa-cv', name: 'Visa CV / Resume', accept: '.pdf,.doc,.docx', active: true, sortOrder: 65, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL' },
    { id: 'sponsorship-affidavit', name: 'Sponsorship Affidavit', accept: '.pdf', active: true, sortOrder: 70, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,AUS,IRL,NZL' },
    { id: 'ca-report', name: 'CA Report', accept: '.pdf', active: true, sortOrder: 75, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,AUS,IRL,NZL' },
    { id: 'itr-tax', name: 'ITR (Income Tax Returns)', accept: '.pdf', active: true, sortOrder: 80, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'USA,CAN,DEU,AUS,IRL,NZL' },
    { id: 'same-name-affidavit', name: 'Same Name Certificate / Affidavit', accept: '.pdf', active: true, sortOrder: 85, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,DEU,AUS,IRL,NZL' },
    { id: 'tuition-receipt', name: 'Tuition Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 90, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL' },
    { id: 'pcc-cert', name: 'PCC (Police Clearance Certificate)', accept: '.pdf', active: true, sortOrder: 95, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'IRL,NZL' },

    // --- 🇬🇧 UNITED KINGDOM (GBR) SPECIFIC ---
    { id: 'uk-atas-cert', name: 'ATAS Certificate', accept: '.pdf', active: true, sortOrder: 100, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-cas-letter', name: 'CAS Letter', accept: '.pdf', active: true, sortOrder: 105, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-tb-test', name: 'Tuberculosis Screening Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 110, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-birth-cert', name: 'Birth Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 125, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-consent-letter', name: 'Consent Letter (Parents/Guardian)', accept: '.pdf', active: true, sortOrder: 130, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-vfs-appointment', name: 'VFS Appointment Confirmation', accept: '.pdf', active: true, sortOrder: 135, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-ihs-receipt', name: 'IHS Payment Confirmation', accept: '.pdf', active: true, sortOrder: 140, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-visa-app-form', name: 'Visa Application Form', accept: '.pdf', active: true, sortOrder: 145, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },
    { id: 'uk-immigration-docs', name: 'Immigration Documents', accept: '.pdf', active: true, sortOrder: 170, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR' },

    // --- 🇺🇸 UNITED STATES (USA) SPECIFIC ---
    { id: 'us-visa-fee-receipt', name: 'Visa Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 200, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },
    { id: 'us-visa-appointment', name: 'Visa Appointment Confirmation', accept: '.pdf', active: true, sortOrder: 205, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },
    { id: 'us-sevis-fee', name: 'Federal SEVIS Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 210, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },
    { id: 'us-form-i20', name: 'SEVIS I-20 (Issued by Institution)', accept: '.pdf', active: true, sortOrder: 215, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },
    { id: 'us-ds160-confirm', name: 'DS-160 Confirmation Page', accept: '.pdf', active: true, sortOrder: 220, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },
    { id: 'us-non-immigrant-form', name: 'Non-Immigrant Visa Application Form', accept: '.pdf', active: true, sortOrder: 225, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA' },

    // --- 🇨🇦 CANADA (CAN) SPECIFIC ---
    { id: 'ca-loa', name: 'Letter of Acceptance', accept: '.pdf', active: true, sortOrder: 305, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN' },
    { id: 'ca-medical-cert', name: 'Medical Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 315, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN' },
    { id: 'ca-gic-proof', name: 'GIC Payment Proof ($20,635 CAD)', accept: '.pdf', active: true, sortOrder: 320, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'CAN', financialType: 'gic' },
    { id: 'ca-pal-letter', name: 'Provincial Attestation Letter (PAL)', accept: '.pdf', active: true, sortOrder: 325, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN' },
    { id: 'ca-work-exp', name: 'Work Experience', accept: '.pdf', active: true, sortOrder: 345, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN' },
    { id: 'ca-parents-aadhar', name: 'Aadhaar Card of Father and Mother', accept: '.pdf,.jpg,.png', active: true, sortOrder: 355, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'CAN' },
    { id: 'ca-marriage-cert', name: 'Marriage Certificate', accept: '.pdf', active: true, sortOrder: 360, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'CAN' },

    // --- 🇩🇪 GERMANY (DEU) SPECIFIC ---
    { id: 'de-aps-cert', name: 'APS Certificate (Akademische Prüfstelle)', accept: '.pdf', active: true, sortOrder: 400, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU' },
    { id: 'de-health-insurance', name: 'Travel & Health Insurance', accept: '.pdf', active: true, sortOrder: 410, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU' },
    { id: 'de-visa-fee-receipt', name: 'Visa Fee Receipt', accept: '.pdf', active: true, sortOrder: 415, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU' },
    { id: 'de-blocked-account', name: 'Financial Documents (Expatrio - Blocked Account)', accept: '.pdf', active: true, sortOrder: 425, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'DEU', financialType: 'blocked' },
    { id: 'de-self-declaration', name: 'Self Declaration Form', accept: '.pdf', active: true, sortOrder: 430, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU' },
    { id: 'de-visa-form', name: 'Visa Form', accept: '.pdf', active: true, sortOrder: 435, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU' },

    // --- 🇦🇺 AUSTRALIA (AUS) SPECIFIC ---
    { id: 'au-form-956a', name: 'Form 956A (Appointment of Agent)', accept: '.pdf', active: true, sortOrder: 500, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-oshc-cert', name: 'OSHC Certificate (Health Cover)', accept: '.pdf', active: true, sortOrder: 505, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-financial-matrix', name: 'Updated Financial Matrix', accept: '.pdf', active: true, sortOrder: 510, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-family-details', name: 'Family Details Sheet', accept: '.pdf', active: true, sortOrder: 530, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-credit-card-auth', name: 'Credit Card Authorization Form', accept: '.pdf', active: true, sortOrder: 535, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-travel-history', name: 'Travel History', accept: '.pdf', active: true, sortOrder: 540, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-work-history', name: 'Work History', accept: '.pdf', active: true, sortOrder: 545, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-gs-requirement', name: 'Genuine Student (GS) Requirement Statement', accept: '.pdf', active: true, sortOrder: 550, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS' },
    { id: 'au-ecoe', name: 'Electronic Confirmation of Enrolment (eCoE)', accept: '.pdf', active: true, sortOrder: 560, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS' },

    // --- 🇮🇪 IRELAND (IRL) SPECIFIC ---
    { id: 'ie-avats-sheet', name: 'AVATS Summary Sheet', accept: '.pdf', active: true, sortOrder: 600, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-vfs-verify', name: 'VFS Check and Verify Form', accept: '.pdf', active: true, sortOrder: 605, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-health-insurance', name: 'Health Insurance', accept: '.pdf', active: true, sortOrder: 615, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-cover-letter', name: 'Cover Letter (By Applicant)', accept: '.pdf', active: true, sortOrder: 620, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-financial-summary', name: 'Financial Summary', accept: '.pdf', active: true, sortOrder: 625, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-checklist-form', name: 'Visa Checklist Form', accept: '.pdf', active: true, sortOrder: 635, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-immigration-docs', name: 'Immigration Documents', accept: '.pdf', active: true, sortOrder: 655, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL' },
    { id: 'ie-payslips', name: 'Payslips', accept: '.pdf', active: true, sortOrder: 670, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'IRL' },

    // --- 🇳🇿 NEW ZEALAND (NZL) SPECIFIC ---
    { id: 'nz-signed-offer', name: 'Signed Offer Letter (By Student)', accept: '.pdf', active: true, sortOrder: 700, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-academic-docs', name: 'All Academic Documents (Notarized)', accept: '.pdf', active: true, sortOrder: 705, category: 'ACADEMIC', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-family-details', name: 'Family Details Sheet', accept: '.pdf', active: true, sortOrder: 720, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-financial-undertaking', name: 'Financial Undertaking Form', accept: '.pdf', active: true, sortOrder: 735, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-visa-application', name: 'Visa Application', accept: '.pdf', active: true, sortOrder: 745, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-medical-report', name: 'Medical Report (Chest X-Ray)', accept: '.pdf', active: true, sortOrder: 750, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-student-decl', name: 'Student Declaration Form', accept: '.pdf', active: true, sortOrder: 760, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
    { id: 'nz-self-decl', name: 'Student Self Declaration Affidavit', accept: '.pdf', active: true, sortOrder: 765, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL' },
  ]

  for (const item of templates) {
    await saveRequiredDocumentSetting(item)
  }

  return listRequiredDocumentSettings()
}

export function detectStudentProgramLevels(profile: any, applications: any[]): Set<string> {
  const levels = new Set<string>()

  const checkText = (text?: string | null) => {
    if (!text) return
    const t = text.toUpperCase()
    if (t.includes('MASTER') || t.includes('POSTGRAD') || t.includes('PG') || t.includes('MBA') || t.includes('M.SC') || t.includes('M.TECH') || t.includes('M.S') || t.includes('M.A')) {
      levels.add('PG')
    }
    if (t.includes('BACHELOR') || t.includes('UNDERGRAD') || t.includes('UG') || t.includes('B.SC') || t.includes('B.TECH') || t.includes('B.S') || t.includes('B.A')) {
      levels.add('UG')
    }
    if (t.includes('PHD') || t.includes('DOCTOR')) {
      levels.add('PHD')
    }
  }

  checkText(profile?.degree)
  checkText(profile?.educationLevel)
  for (const app of applications || []) {
    checkText(app.program)
  }

  return levels
}

export function normalizeCountryCode(code?: string | null): string[] {
  if (!code) return []
  const c = code.trim().toUpperCase()
  if (c === 'UK' || c === 'GBR' || c === 'GB') return ['UK', 'GBR', 'GB']
  if (c === 'US' || c === 'USA') return ['US', 'USA']
  if (c === 'DE' || c === 'DEU') return ['DE', 'DEU']
  if (c === 'CA' || c === 'CAN') return ['CA', 'CAN']
  if (c === 'AU' || c === 'AUS') return ['AU', 'AUS']
  if (c === 'NZ' || c === 'NZL') return ['NZ', 'NZL']
  if (c === 'IE' || c === 'IRL') return ['IE', 'IRL']
  return [c]
}

export function filterStudentRequiredDocuments<T extends { stage: DocumentStage; countryCode?: string | null; programLevel?: string | null }>(
  allRequired: T[],
  options: {
    studentCountries: Set<string>
    hasApplications: boolean
    visaActiveCountries: Set<string>
    studentProgramLevels?: Set<string>
  }
): T[] {
  const { studentCountries, hasApplications, visaActiveCountries, studentProgramLevels } = options

  return allRequired.filter(doc => {
    // 1. Program Level Gate Check:
    const docLevel = (doc.programLevel || 'ALL').trim().toUpperCase()
    if (docLevel && docLevel !== 'ALL') {
      if (studentProgramLevels && studentProgramLevels.size > 0) {
        const allowedLevels = docLevel.split(',').map(l => l.trim().toUpperCase())
        const match = allowedLevels.some(lvl => studentProgramLevels.has(lvl))
        if (!match) return false
      }
    }

    // 2. Stage Gate Check:
    if (doc.stage === 'VISA_PROCESSING') {
      // Visa documents are ONLY visible if student has an active application in Visa processing for one of the document's countries!
      if (visaActiveCountries.size === 0) return false
      const rawCountry = (doc.countryCode || '').trim()
      if (!rawCountry || rawCountry === 'GLOBAL') {
        return visaActiveCountries.size > 0
      }
      const allowedCodes = rawCountry.split(',').flatMap(c => normalizeCountryCode(c))
      return allowedCodes.some(code => visaActiveCountries.has(code))
    }

    if (doc.stage === 'APPLICATION_SUBMISSION') {
      if (!hasApplications && doc.countryCode) return false
    }

    // 3. Country Gate Check (for PROFILE_ONBOARDING and APPLICATION_SUBMISSION):
    const rawCountry = (doc.countryCode || '').trim()
    if (!rawCountry || rawCountry === 'GLOBAL') {
      return true // Global onboarding documents always visible
    }

    // If document is country-specific, only show if student has selected that destination country
    if (studentCountries.size === 0) {
      return false
    }

    const allowedCodes = rawCountry.split(',').flatMap(c => normalizeCountryCode(c))
    return allowedCodes.some(code => studentCountries.has(code))
  })
}
