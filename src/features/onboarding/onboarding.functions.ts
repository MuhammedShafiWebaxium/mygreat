import { createServerFn } from '@tanstack/react-start'
import { readOnboardingCatalog, readOnboardingCourseDetails, readOnboardingCourses } from './onboarding.server'

export const getOnboardingCatalogFn = createServerFn({ method:'GET' }).handler(() => readOnboardingCatalog())
export const getOnboardingCoursesFn = createServerFn({method:'GET'})
  .validator((countryId:string)=>countryId)
  .handler(({data})=>readOnboardingCourses(data))

export const getOnboardingCourseDetailsFn = createServerFn({method:'POST'})
  .validator((input:{countryIds:string[];names:string[];level:string;universityIds:string[]})=>input)
  .handler(({data})=>readOnboardingCourseDetails(data))
