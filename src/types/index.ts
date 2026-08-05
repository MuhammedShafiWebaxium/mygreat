export interface Country {
  id: string
  name: string
  flag: string
  tagline: string
  universities: number
  avgTuition: string
  cities: string[]
}

export interface University {
  id: string
  name: string
  city: string
  countryId: string
  rank: number
  tuition: string
  acceptance: string
  knownFor: string
  website?: string
  courseCount?: number
}

export interface OnboardingCourseOption {
  name: string
  level: string
  universityIds: string[]
  countryIds?: string[]
  minFeeInr?: number
    feeInrValues?: number[]
    universityFeesInr?: Record<string, number>
    universityFeeValuesInr?: Record<string, number[]>
    intakeMonths?: string[]
    universityIntakeMonths?: Record<string, string[]>
    universities?: University[]
    offerings?: OnboardingCourseOffering[]
}

export interface OnboardingCourseOffering {
  courseId: string
  universityId: string
  universityName: string
  countryId: string
  city: string
  code: string
  campus: string
  durationMonths: number
  intakeMonth: string[]
  intakeYear: string
  tuitionFee: string
  feeAmount: string
  feeCurrency: string
  amountInr: string
  ranking: string
  ieltsMin: string
  toeflMin: string
  pteMin: string
  applicationDeadline: string
  scholarshipAvailable: string
  requirements: string
  entryRequirements: string
  backlogRange: string
  applicationMode: string
  englishProficiency: string
  remarks: string
}

export interface OnboardingData {
  country: Country | null
  countries: Country[]
  educationLevel: string
  degree: string
  field: string
  fields: string[]
  feeMinInr: number | null
  feeMaxInr: number | null
  gpa: number
  gradYear: string
  englishTest: string
  intake: string
  universities: University[]
  notSure: boolean
  agencyDetails?: StudentAgencyDetails
}

export interface StudentAgencyDetails {
  dateOfBirth: string
  gender: string
  maritalStatus: string
  nationality: string
  residenceCountry: string
  addressLine: string
  city: string
  state: string
  postalCode: string
  passportStatus: string
  passportNumber: string
  passportExpiry: string
  preferredContactMethod: string
  whatsappNumber: string
  emergencyContactName: string
  emergencyContactRelation: string
  emergencyContactPhone: string
  fundingSource: string
  sponsorName: string
  educationLoanStatus: string
  visaRefusalHistory: string
  visaRefusalDetails: string
  travelHistory: string
  workExperienceYears: string
  counsellingNotes: string
}
