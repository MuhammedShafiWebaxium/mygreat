import { queryOptions } from '@tanstack/react-query'
import { getMyDashboardFn } from './workflow.functions'

export const myDashboardQuery = queryOptions({
  queryKey: ['student', 'dashboard'],
  queryFn: () => getMyDashboardFn(),
})

