import { queryOptions } from '@tanstack/react-query'
import { getStaffQueueFn, listStaffFn, listStudentsFn } from './admin.functions'

export const staffQueueQuery = queryOptions({
  queryKey: ['staff', 'queue'],
  queryFn: () => getStaffQueueFn(),
})
export const staffListQuery = queryOptions({
  queryKey: ['staff', 'users'],
  queryFn: () => listStaffFn(),
})
export const staffStudentsQuery = queryOptions({
  queryKey: ['staff', 'students'],
  queryFn: () => listStudentsFn(),
})

