import { queryOptions } from '@tanstack/react-query'
import { getCurrentUserFn } from './auth.functions'

export const currentUserQuery = queryOptions({
  queryKey: ['auth', 'current-user'],
  queryFn: () => getCurrentUserFn(),
  staleTime: 30_000,
})

