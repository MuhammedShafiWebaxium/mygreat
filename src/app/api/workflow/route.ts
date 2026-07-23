import { NextResponse } from 'next/server'
import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { applicationUpdateSchema, createApplicationSchema, taskToggleSchema } from '@/features/workflow/workflow.schema'
import { createApplication, readStudentDashboard, setTaskCompleted, updateApplication } from '@/features/workflow/workflow.server'
import { apiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireUser()
    assertRole(user.role, ['STUDENT'])
    return NextResponse.json(await readStudentDashboard(user.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const body = await request.json()
    if (body.action === 'createApplication') {
      assertRole(user.role, ['STUDENT'])
      return NextResponse.json(await createApplication(user.id, createApplicationSchema.parse(body.data)))
    }
    if (body.action === 'toggleTask') {
      assertRole(user.role, ['STUDENT'])
      const data = taskToggleSchema.parse(body.data)
      return NextResponse.json(await setTaskCompleted(user.id, data.taskId, data.completed))
    }
    if (body.action === 'updateApplication') {
      assertRole(user.role, ['SUPER_ADMIN', 'ADMISSIONS_EXECUTIVE', 'VISA_EXECUTIVE'])
      return NextResponse.json(await updateApplication(user, applicationUpdateSchema.parse(body.data)))
    }
    return NextResponse.json({ error: 'Unknown workflow action.' }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}
