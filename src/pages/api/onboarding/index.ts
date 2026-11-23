import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'

const profileSchema = z
  .object({
    role: z.enum(['talent', 'client']),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    profession: z.string().trim().max(120).optional(),
    skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    portfolioUrl: z.union([z.string().url(), z.literal('')]).optional(),
    bio: z.string().trim().max(1000).optional(),
    companyName: z.string().trim().max(160).optional(),
    companyIndustry: z.string().trim().max(120).optional(),
    companyWebsite: z.union([z.string().url(), z.literal('')]).optional(),
    companyLocation: z.string().trim().max(160).optional(),
  })
  .superRefine((profile, context) => {
    if (profile.role === 'talent' && !profile.profession?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['profession'],
        message: 'Add your primary profession.',
      })
    }

    if (profile.role === 'talent' && !profile.skills?.length) {
      context.addIssue({
        code: 'custom',
        path: ['skills'],
        message: 'Add at least one skill.',
      })
    }

    if (profile.role === 'client' && !profile.companyName?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['companyName'],
        message: 'Add your company or organization name.',
      })
    }
  })

async function getAccount(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) {
    res.status(401).json({ message: 'Sign in to update your profile.' })
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    res.status(409).json({
      message: 'Your account has not been imported into the new profile service yet.',
    })
    return null
  }

  return user
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'GET, PATCH')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const account = await getAccount(req, res)
    if (!account) return

    if (req.method === 'GET') {
      const profile = await prisma.user.findUnique({
        where: { id: account.id },
        select: {
          role: true,
          firstName: true,
          lastName: true,
          profession: true,
          skills: true,
          portfolioUrl: true,
          bio: true,
          companyName: true,
          companyIndustry: true,
          companyWebsite: true,
          companyLocation: true,
          onboardingDone: true,
          phoneVerified: true,
          telephone: true,
        },
      })

      return res.status(200).json(profile)
    }

    const parsed = profileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(422).json({
        message: parsed.error.issues[0]?.message ?? 'Invalid profile details.',
        field: parsed.error.issues[0]?.path[0],
      })
    }

    const profile = parsed.data
    const updated = await prisma.user.update({
      where: { id: account.id },
      data: {
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profession: profile.profession || null,
        skills: profile.skills ?? [],
        portfolioUrl: profile.portfolioUrl || null,
        bio: profile.bio || null,
        companyName: profile.companyName || null,
        companyIndustry: profile.companyIndustry || null,
        companyWebsite: profile.companyWebsite || null,
        companyLocation: profile.companyLocation || null,
        onboardingDone: true,
      },
      select: { onboardingDone: true },
    })

    return res.status(200).json(updated)
  } catch (error) {
    console.error('Profile onboarding request failed:', error)
    return res.status(500).json({ message: 'Could not save your profile.' })
  }
}
