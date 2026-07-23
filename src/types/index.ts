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
}

export interface OnboardingData {
  country: Country | null
  educationLevel: string
  degree: string
  field: string
  gpa: number
  gradYear: string
  englishTest: string
  intake: string
  universities: University[]
  notSure: boolean
}

