import { createServerFn } from '@tanstack/react-start'
import { accountSchema, loginSchema, registerSchema } from './auth.schema'
import { authenticate, registerStudent, updateAccount } from './auth.server'
import { deleteUserSession, getSessionUser } from './session.server'

export const registerStudentFn = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(({ data }) => registerStudent(data))

export const loginFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(({ data }) => authenticate(data))

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  await deleteUserSession()
  return { success: true as const }
})

export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(() => getSessionUser())

export const updateMyAccountFn = createServerFn({ method: 'POST' })
  .validator(accountSchema)
  .handler(async ({ data }) => {
    const user = await getSessionUser()
    if (!user || user.accountType !== 'STUDENT') throw new Error('Student authentication required.')
    return updateAccount(user.id, data)
  })
