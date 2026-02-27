import { createLocalReq, getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

import { OnboardingService } from '@/lib/members/onboarding-service'

interface OrganizationOnboardingBody {
  mode: 'organization'
  orgMode: 'create' | 'select'
  orgContactId?: number
  orgName?: string
  orgEmail?: string
  orgPhone?: string
  primaryMode: 'create' | 'select' | 'none'
  primaryContactId?: number
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  membershipTierId?: number
}

interface IndividualOnboardingBody {
  mode: 'individual'
  name: string
  email?: string
  phone?: string
  membershipTierId?: number
}

type OnboardingBody = OrganizationOnboardingBody | IndividualOnboardingBody

/**
 * Staff-assisted onboarding endpoint for admin workflows.
 */
export async function POST(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = (await req.json()) as OnboardingBody
  const service = new OnboardingService(payload)
  const payloadReq = await createLocalReq({ user }, payload)
  const actorId = String(user.id)

  try {
    if (body.mode === 'individual') {
      const result = await service.onboardIndividual(
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          membershipTierId: body.membershipTierId,
        },
        actorId,
        payloadReq,
      )

      return Response.json({ ok: true, result })
    }

    if (body.orgMode === 'create') {
      if (body.primaryMode !== 'create' || !body.primaryContactName || !body.orgName) {
        return new Response('Invalid create organization payload', { status: 400 })
      }

      const result = await service.onboardOrganization(
        {
          orgName: body.orgName,
          orgEmail: body.orgEmail,
          orgPhone: body.orgPhone,
          primaryContactName: body.primaryContactName,
          primaryContactEmail: body.primaryContactEmail,
          primaryContactPhone: body.primaryContactPhone,
          membershipTierId: body.membershipTierId,
        },
        actorId,
        payloadReq,
      )

      return Response.json({ ok: true, result })
    }

    if (!body.orgContactId) {
      return new Response('orgContactId required when orgMode=select', { status: 400 })
    }

    const result = await service.onboardOrganizationFromExisting(
      {
        orgContactId: body.orgContactId,
        primaryContactId: body.primaryMode === 'select' ? body.primaryContactId : undefined,
        primaryContactName: body.primaryMode === 'create' ? body.primaryContactName : undefined,
        primaryContactEmail: body.primaryMode === 'create' ? body.primaryContactEmail : undefined,
        primaryContactPhone: body.primaryMode === 'create' ? body.primaryContactPhone : undefined,
        membershipTierId: body.membershipTierId,
      },
      actorId,
      payloadReq,
    )

    return Response.json({ ok: true, result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown onboarding error'
    payload.logger.error({ err: error, message: 'Onboarding endpoint failed' })
    return new Response(message, { status: 500 })
  }
}
