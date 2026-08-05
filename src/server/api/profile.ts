import { assertRole, requireUser } from '@/features/auth/authorization.server'
import { z } from 'zod'
import { agencyProfileUpdateSchema, onboardingSchema } from '@/features/profile/profile.schema'
import { addStudentShortlistedUniversity, readStudentProfile, updateStudentAgencyProfile, writeStudentProfile } from '@/features/profile/profile.server'
import { apiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireUser()
    assertRole(user.role, ['STUDENT'])
    return Response.json(await readStudentProfile(user.id))
  } catch (error) {
    return apiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser()
    assertRole(user.role, ['STUDENT'])
    return Response.json(await writeStudentProfile(user.id, onboardingSchema.parse(await request.json())))
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request:Request){try{const user=await requireUser();assertRole(user.role,['STUDENT']);return Response.json(await updateStudentAgencyProfile(user.id,agencyProfileUpdateSchema.parse(await request.json())))}catch(error){return apiError(error)}}

export async function POST(request:Request){try{const user=await requireUser();assertRole(user.role,['STUDENT']);const {universityId}=z.object({universityId:z.string().min(1)}).parse(await request.json());return Response.json(await addStudentShortlistedUniversity(user.id,universityId))}catch(error){return apiError(error)}}
