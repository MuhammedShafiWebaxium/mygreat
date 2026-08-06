import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

async function main() {
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  })

  try {
    console.log('Clearing old duplicate document settings and seeding clean multi-country templates with program level gating...')

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE required_document_settings CASCADE;`)

    const templates = [
      // --- GLOBAL ONBOARDING & ACADEMIC PREREQUISITES ---
      { id: 'passport-doc', name: 'Passport (First & Last Page)', accept: '.pdf,.jpg,.png', active: true, sortOrder: 10, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'ALL', financialType: null },
      { id: 'photo-doc', name: 'Passport Size Photo', accept: '.jpg,.jpeg,.png', active: true, sortOrder: 15, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'ALL', financialType: null },
      { id: 'aadhaar-doc', name: 'Aadhaar Card', accept: '.pdf,.jpg,.png', active: true, sortOrder: 20, category: 'PERSONAL', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'ALL', financialType: null },
      { id: '10th-marksheet', name: '10th Standard Marksheet / Certificate', accept: '.pdf', active: true, sortOrder: 30, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'ALL', financialType: null },
      { id: '12th-marksheet', name: '12th Standard Marksheet / Certificate', accept: '.pdf', active: true, sortOrder: 35, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'ALL', financialType: null },
      { id: 'bachelor-degree', name: 'Bachelor Degree Certificate / Transcripts', accept: '.pdf', active: true, sortOrder: 40, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: null, programLevel: 'PG,PHD', financialType: null },
      { id: 'lor-letter', name: 'Letter of Recommendation (LOR)', accept: '.pdf,.doc,.docx', active: true, sortOrder: 45, category: 'ACADEMIC', stage: 'APPLICATION_SUBMISSION', countryCode: null, programLevel: 'ALL', financialType: null },

      // --- MULTI-COUNTRY SHARED REQUIREMENTS ---
      { id: 'ielts-cert', name: 'IELTS / English Test Certificate', accept: '.pdf', active: true, sortOrder: 50, category: 'ACADEMIC', stage: 'PROFILE_ONBOARDING', countryCode: 'GBR,CAN,IRL,NZL,AUS,USA', programLevel: 'ALL', financialType: null },
      { id: 'visa-sop', name: 'Visa SOP / Statement of Purpose', accept: '.pdf,.doc,.docx', active: true, sortOrder: 60, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL,NZL', programLevel: 'ALL', financialType: null },
      { id: 'visa-cv', name: 'Visa CV / Resume', accept: '.pdf,.doc,.docx', active: true, sortOrder: 65, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL', programLevel: 'ALL', financialType: null },
      { id: 'sponsorship-affidavit', name: 'Sponsorship Affidavit', accept: '.pdf', active: true, sortOrder: 70, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,AUS,IRL,NZL', programLevel: 'ALL', financialType: null },
      { id: 'ca-report', name: 'CA Report', accept: '.pdf', active: true, sortOrder: 75, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,AUS,IRL,NZL', programLevel: 'ALL', financialType: null },
      { id: 'itr-tax', name: 'ITR (Income Tax Returns)', accept: '.pdf', active: true, sortOrder: 80, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'USA,CAN,DEU,AUS,IRL,NZL', programLevel: 'ALL', financialType: null },
      { id: 'same-name-affidavit', name: 'Same Name Certificate / Affidavit', accept: '.pdf', active: true, sortOrder: 85, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,USA,CAN,DEU,AUS,IRL,NZL', programLevel: 'ALL', financialType: null },
      { id: 'tuition-receipt', name: 'Tuition Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 90, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'GBR,CAN,DEU,IRL', programLevel: 'ALL', financialType: null },
      { id: 'pcc-cert', name: 'PCC (Police Clearance Certificate)', accept: '.pdf', active: true, sortOrder: 95, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'IRL,NZL', programLevel: 'ALL', financialType: null },

      // --- 🇬🇧 UNITED KINGDOM (GBR) SPECIFIC ---
      { id: 'uk-atas-cert', name: 'ATAS Certificate', accept: '.pdf', active: true, sortOrder: 100, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-cas-letter', name: 'CAS Letter', accept: '.pdf', active: true, sortOrder: 105, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-tb-test', name: 'Tuberculosis Screening Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 110, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-birth-cert', name: 'Birth Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 125, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-consent-letter', name: 'Consent Letter (Parents/Guardian)', accept: '.pdf', active: true, sortOrder: 130, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-vfs-appointment', name: 'VFS Appointment Confirmation', accept: '.pdf', active: true, sortOrder: 135, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-ihs-receipt', name: 'IHS Payment Confirmation', accept: '.pdf', active: true, sortOrder: 140, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-visa-app-form', name: 'Visa Application Form', accept: '.pdf', active: true, sortOrder: 145, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },
      { id: 'uk-immigration-docs', name: 'Immigration Documents', accept: '.pdf', active: true, sortOrder: 170, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'GBR', programLevel: 'ALL', financialType: null },

      // --- 🇺🇸 UNITED STATES (USA) SPECIFIC ---
      { id: 'us-visa-fee-receipt', name: 'Visa Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 200, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },
      { id: 'us-visa-appointment', name: 'Visa Appointment Confirmation', accept: '.pdf', active: true, sortOrder: 205, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },
      { id: 'us-sevis-fee', name: 'Federal SEVIS Fee Payment Receipt', accept: '.pdf', active: true, sortOrder: 210, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },
      { id: 'us-form-i20', name: 'SEVIS I-20 (Issued by Institution)', accept: '.pdf', active: true, sortOrder: 215, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },
      { id: 'us-ds160-confirm', name: 'DS-160 Confirmation Page', accept: '.pdf', active: true, sortOrder: 220, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },
      { id: 'us-non-immigrant-form', name: 'Non-Immigrant Visa Application Form', accept: '.pdf', active: true, sortOrder: 225, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'USA', programLevel: 'ALL', financialType: null },

      // --- 🇨🇦 CANADA (CAN) SPECIFIC ---
      { id: 'ca-loa', name: 'Letter of Acceptance', accept: '.pdf', active: true, sortOrder: 305, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },
      { id: 'ca-medical-cert', name: 'Medical Certificate', accept: '.pdf,.jpg,.png', active: true, sortOrder: 315, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },
      { id: 'ca-gic-proof', name: 'GIC Payment Proof ($20,635 CAD)', accept: '.pdf', active: true, sortOrder: 320, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: 'gic' },
      { id: 'ca-pal-letter', name: 'Provincial Attestation Letter (PAL)', accept: '.pdf', active: true, sortOrder: 325, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },
      { id: 'ca-work-exp', name: 'Work Experience', accept: '.pdf', active: true, sortOrder: 345, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },
      { id: 'ca-parents-aadhar', name: 'Aadhaar Card of Father and Mother', accept: '.pdf,.jpg,.png', active: true, sortOrder: 355, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },
      { id: 'ca-marriage-cert', name: 'Marriage Certificate', accept: '.pdf', active: true, sortOrder: 360, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'CAN', programLevel: 'ALL', financialType: null },

      // --- 🇩🇪 GERMANY (DEU) SPECIFIC ---
      { id: 'de-aps-cert', name: 'APS Certificate (Akademische Prüfstelle)', accept: '.pdf', active: true, sortOrder: 400, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: null },
      { id: 'de-health-insurance', name: 'Travel & Health Insurance', accept: '.pdf', active: true, sortOrder: 410, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: null },
      { id: 'de-visa-fee-receipt', name: 'Visa Fee Receipt', accept: '.pdf', active: true, sortOrder: 415, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: null },
      { id: 'de-blocked-account', name: 'Financial Documents (Expatrio - Blocked Account)', accept: '.pdf', active: true, sortOrder: 425, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: 'blocked' },
      { id: 'de-self-declaration', name: 'Self Declaration Form', accept: '.pdf', active: true, sortOrder: 430, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: null },
      { id: 'de-visa-form', name: 'Visa Form', accept: '.pdf', active: true, sortOrder: 435, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'DEU', programLevel: 'ALL', financialType: null },

      // --- 🇦🇺 AUSTRALIA (AUS) SPECIFIC ---
      { id: 'au-form-956a', name: 'Form 956A (Appointment of Agent)', accept: '.pdf', active: true, sortOrder: 500, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-oshc-cert', name: 'OSHC Certificate (Health Cover)', accept: '.pdf', active: true, sortOrder: 505, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-financial-matrix', name: 'Updated Financial Matrix', accept: '.pdf', active: true, sortOrder: 510, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-family-details', name: 'Family Details Sheet', accept: '.pdf', active: true, sortOrder: 530, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-credit-card-auth', name: 'Credit Card Authorization Form', accept: '.pdf', active: true, sortOrder: 535, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-travel-history', name: 'Travel History', accept: '.pdf', active: true, sortOrder: 540, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-work-history', name: 'Work History', accept: '.pdf', active: true, sortOrder: 545, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-gs-requirement', name: 'Genuine Student (GS) Requirement Statement', accept: '.pdf', active: true, sortOrder: 550, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },
      { id: 'au-ecoe', name: 'Electronic Confirmation of Enrolment (eCoE)', accept: '.pdf', active: true, sortOrder: 560, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'AUS', programLevel: 'ALL', financialType: null },

      // --- 🇮🇪 IRELAND (IRL) SPECIFIC ---
      { id: 'ie-avats-sheet', name: 'AVATS Summary Sheet', accept: '.pdf', active: true, sortOrder: 600, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-vfs-verify', name: 'VFS Check and Verify Form', accept: '.pdf', active: true, sortOrder: 605, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-health-insurance', name: 'Health Insurance', accept: '.pdf', active: true, sortOrder: 615, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-cover-letter', name: 'Cover Letter (By Applicant)', accept: '.pdf', active: true, sortOrder: 620, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-financial-summary', name: 'Financial Summary', accept: '.pdf', active: true, sortOrder: 625, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-checklist-form', name: 'Visa Checklist Form', accept: '.pdf', active: true, sortOrder: 635, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-immigration-docs', name: 'Immigration Documents', accept: '.pdf', active: true, sortOrder: 655, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },
      { id: 'ie-payslips', name: 'Payslips', accept: '.pdf', active: true, sortOrder: 670, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'IRL', programLevel: 'ALL', financialType: null },

      // --- 🇳🇿 NEW ZEALAND (NZL) SPECIFIC ---
      { id: 'nz-signed-offer', name: 'Signed Offer Letter (By Student)', accept: '.pdf', active: true, sortOrder: 700, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-academic-docs', name: 'All Academic Documents (Notarized)', accept: '.pdf', active: true, sortOrder: 705, category: 'ACADEMIC', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-family-details', name: 'Family Details Sheet', accept: '.pdf', active: true, sortOrder: 720, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-financial-undertaking', name: 'Financial Undertaking Form', accept: '.pdf', active: true, sortOrder: 735, category: 'FINANCIAL', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-visa-application', name: 'Visa Application', accept: '.pdf', active: true, sortOrder: 745, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-medical-report', name: 'Medical Report (Chest X-Ray)', accept: '.pdf', active: true, sortOrder: 750, category: 'VISA_COUNTRY', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-student-decl', name: 'Student Declaration Form', accept: '.pdf', active: true, sortOrder: 760, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
      { id: 'nz-self-decl', name: 'Student Self Declaration Affidavit', accept: '.pdf', active: true, sortOrder: 765, category: 'PERSONAL', stage: 'VISA_PROCESSING', countryCode: 'NZL', programLevel: 'ALL', financialType: null },
    ]

    for (const item of templates) {
      await prisma.$executeRaw`
        INSERT INTO required_document_settings (
          id, name, accept, active, sort_order, category, stage, country_code, program_level, financial_type, created_at, updated_at
        ) VALUES (
          ${item.id}, ${item.name}, ${item.accept}, ${item.active}, ${item.sortOrder},
          ${item.category}::document_category, ${item.stage}::document_stage, ${item.countryCode}, ${item.programLevel}, ${item.financialType}, NOW(), NOW()
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
      `
    }

    const total = await prisma.requiredDocumentSetting.count()
    console.log('Program level template seeding completed successfully!')
    console.log('Total document requirement rules in DB:', total)

  } catch (err) {
    console.error('Error during full seeding:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
