import { queryOptions } from '@tanstack/react-query'
import { getAssignmentOptionsFn, getDocumentReviewQueueFn, getPrimaryApplicationQueueFn, getStaffQueueFn, listPartnersFn, listStaffFn, listStudentsFn, listUniversityCatalogFn } from './admin.functions'

export const staffQueueQuery = queryOptions({
  queryKey: ['staff', 'queue'],
  queryFn: () => getStaffQueueFn(),
})
export const primaryApplicationQueueQuery = queryOptions({
  queryKey: ['staff', 'primary-applications'],
  queryFn: () => getPrimaryApplicationQueueFn(),
})
export const staffListQuery = queryOptions({
  queryKey: ['staff', 'users'],
  queryFn: () => listStaffFn(),
})
export const staffStudentsQuery = queryOptions({
  queryKey: ['staff', 'students'],
  queryFn: () => listStudentsFn(),
})
export const partnerApplicationsQuery = queryOptions({
  queryKey: ['staff', 'partners'],
  queryFn: () => listPartnersFn(),
})
export const assignmentOptionsQuery = queryOptions({
  queryKey: ['staff', 'assignment-options'],
  queryFn: () => getAssignmentOptionsFn(),
})
export const documentReviewQueueQuery = queryOptions({
  queryKey: ['staff', 'document-reviews'],
  queryFn: () => getDocumentReviewQueueFn(),
})
export const universityCatalogQuery = queryOptions({ queryKey: ['staff', 'university-catalog'], queryFn: listUniversityCatalogFn })
