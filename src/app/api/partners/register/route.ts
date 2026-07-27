import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { registerPartner } from '@/features/partners/partner.server'
import { partnerRegistrationSchema } from '@/features/partners/partner.schema'

export async function POST(request: Request) {
  try {
    return NextResponse.json(
      await registerPartner(partnerRegistrationSchema.parse(await request.json())),
      { status: 201 },
    )
  } catch (error) {
    return apiError(error)
  }
}
