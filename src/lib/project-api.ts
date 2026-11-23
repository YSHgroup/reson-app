import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import { prisma } from './prisma'

const projectInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(20_000),
  startLine: z.union([z.string(), z.date()]).nullable().optional(),
  deadLine: z.union([z.string(), z.date()]).nullable().optional(),
  price: z.coerce.number().finite().min(0).nullable().optional(),
  payType: z.string().max(80).nullable().optional(),
  where: z.string().max(160).nullable().optional(),
  location: z
    .union([
      z.string().max(200),
      z.object({
        latitude: z.number().finite().min(-90).max(90).nullable(),
        longitude: z.number().finite().min(-180).max(180).nullable(),
      }),
    ])
    .nullable()
    .optional(),
  payUnit: z.string().max(40).nullable().optional(),
  role: z.string().max(120).nullable().optional(),
})

export async function getPrismaAccount(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  const email = session?.user?.email?.trim().toLowerCase()

  if (!email) return { status: 'unauthenticated' as const }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, connects: true },
  })
  if (!user) return { status: 'unauthenticated' as const }

  return { status: 'ready' as const, user }
}

export function legacyBody(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    const parsed: unknown = JSON.parse(value)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    throw new Error('Request body must be an object.')
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  throw new Error('Request body must be an object.')
}

export function parseProjectInput(value: unknown) {
  const body = legacyBody(value)
  const parsed = projectInputSchema.safeParse(body)
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? 'Invalid project details.',
    }
  }

  const startLine = parseDate(parsed.data.startLine)
  const deadline = parseDate(parsed.data.deadLine)
  if (
    (parsed.data.startLine != null && !startLine) ||
    (parsed.data.deadLine != null && !deadline)
  ) {
    return { success: false as const, message: 'Enter valid project dates.' }
  }

  const coordinates =
    parsed.data.location && typeof parsed.data.location === 'object'
      ? parsed.data.location
      : null

  return {
    success: true as const,
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startLine,
      deadline,
      price: parsed.data.price ?? null,
      payType: parsed.data.payType || null,
      workMode: parsed.data.role || null,
      location:
        parsed.data.where ||
        (typeof parsed.data.location === 'string'
          ? parsed.data.location
          : null),
      latitude:
        coordinates?.latitude === null ? undefined : coordinates?.latitude,
      longitude:
        coordinates?.longitude === null ? undefined : coordinates?.longitude,
      payUnit: parsed.data.payUnit || null,
      category: parsed.data.role || null,
    },
  }
}

function parseDate(value: string | Date | null | undefined) {
  if (value == null) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
