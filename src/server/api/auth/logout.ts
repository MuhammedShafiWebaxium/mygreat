import { deleteUserSession } from '@/features/auth/session.server'
import { apiError } from '@/lib/api'

export async function POST() {
  try {
    await deleteUserSession()
    return Response.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
