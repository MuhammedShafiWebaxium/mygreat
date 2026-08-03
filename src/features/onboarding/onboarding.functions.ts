import { createServerFn } from '@tanstack/react-start'
import { readOnboardingCatalog, readOnboardingCourses } from './onboarding.server'

export const getOnboardingCatalogFn = createServerFn({ method:'GET' }).handler(() => readOnboardingCatalog())
export const getOnboardingCoursesFn = createServerFn({method:'GET'})
  .validator((countryId:string)=>countryId)
  .handler(({data})=>readOnboardingCourses(data))
