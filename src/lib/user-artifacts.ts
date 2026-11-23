import { prisma } from '@lib/prisma'
import { Prisma } from '../generated/prisma/client'

export async function appendUserArtifact(
  userId: string,
  kind: string,
  entry: Prisma.InputJsonValue,
  limit = 50
) {
  await prisma.$transaction(async (transaction) => {
    await transaction.userArtifact.create({
      data: { userId, kind, entry },
    })
    const expired = await transaction.userArtifact.findMany({
      where: { userId, kind },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: limit,
      select: { id: true },
    })
    if (expired.length) {
      await transaction.userArtifact.deleteMany({
        where: { id: { in: expired.map(({ id }) => id) } },
      })
    }
  })
}

export async function latestUserArtifact(userId: string, kind: string) {
  return prisma.userArtifact.findFirst({
    where: { userId, kind },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { entry: true },
  })
}

export async function recentUserArtifacts(userId: string, kind: string) {
  const entries = await prisma.userArtifact.findMany({
    where: { userId, kind },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { entry: true },
  })
  return entries.map(({ entry }) => entry)
}
