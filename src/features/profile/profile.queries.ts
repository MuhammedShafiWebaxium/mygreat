import { queryOptions } from '@tanstack/react-query'
import { getMyProfileFn } from './profile.functions'

export const myProfileQuery = queryOptions({
  queryKey: ['student', 'profile'],
  queryFn: () => getMyProfileFn(),
})

