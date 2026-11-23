import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@lib/prisma'

async function attemptPayload(attempt: {
  id: string
  category: string
  expiresAt: Date
  questionIds: string[]
}) {
  const questions = await prisma.skillQuestion.findMany({
    where: { id: { in: attempt.questionIds } },
    select: { id: true, prompt: true, options: true },
  })
  const questionOrder = new Map(
    attempt.questionIds.map((questionId, index) => [questionId, index])
  )
  questions.sort(
    (left, right) =>
      (questionOrder.get(left.id) ?? 0) - (questionOrder.get(right.id) ?? 0)
  )

  return {
    attemptId: attempt.id,
    category: attempt.category,
    expiresAt: attempt.expiresAt,
    questions,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email?.trim().toLowerCase()
    if (!email) return res.status(401).json({ message: 'Sign in to continue.' })

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        onboardingDone: true,
        skillTestPassed: true,
      },
    })
    if (!user) {
      return res.status(409).json({
        message: 'Your account has not been imported into the new profile service yet.',
      })
    }

    if (req.method === 'GET') {
      const [categories, activeAttempt] = await Promise.all([
        prisma.skillQuestion.groupBy({
          by: ['category'],
          _count: { _all: true },
        }),
        prisma.skillAttempt.findFirst({
          where: {
            userId: user.id,
            status: 'IN_PROGRESS',
            expiresAt: { gt: new Date() },
          },
          orderBy: { startedAt: 'desc' },
        }),
      ])

      return res.status(200).json({
        categories: categories
          .filter((category) => category._count._all >= 5)
          .map(({ category, _count }) => ({
            name: category,
            questionCount: _count._all,
          })),
        skillTestPassed: user.skillTestPassed,
        activeAttempt: activeAttempt
          ? await attemptPayload(activeAttempt)
          : null,
      })
    }

    if (user.role !== 'talent' || !user.onboardingDone) {
      return res.status(403).json({
        message: 'Complete your professional profile before starting an assessment.',
      })
    }
    if (user.skillTestPassed) {
      return res.status(409).json({
        message: 'You have already passed a skill assessment.',
      })
    }

    const category =
      typeof req.body?.category === 'string' ? req.body.category : ''
    if (!category || category.length > 80) {
      return res.status(422).json({ message: 'Choose a valid skill category.' })
    }

    const now = new Date()
    const activeAttempt = await prisma.skillAttempt.findFirst({
      where: { userId: user.id, status: 'IN_PROGRESS' },
      orderBy: { startedAt: 'desc' },
    })

    if (activeAttempt && activeAttempt.expiresAt > now) {
      return res.status(200).json(await attemptPayload(activeAttempt))
    }
    if (activeAttempt) {
      await prisma.skillAttempt.update({
        where: { id: activeAttempt.id },
        data: { status: 'FAILED', completedAt: now },
      })
    }

    const attemptsToday = await prisma.skillAttempt.count({
      where: {
        userId: user.id,
        category,
        startedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    })
    if (attemptsToday >= 3) {
      return res.status(429).json({
        message: 'You have used all three attempts for this category today.',
      })
    }

    const questions = await prisma.skillQuestion.findMany({
      where: { category },
      select: { id: true },
    })
    if (questions.length < 5) {
      return res.status(404).json({
        message: 'This category does not have enough questions yet.',
      })
    }

    for (let index = questions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1))
      ;[questions[index], questions[swapIndex]] = [
        questions[swapIndex],
        questions[index],
      ]
    }
    const questionIds = questions.slice(0, 5).map((question) => question.id)
    const attempt = await prisma.skillAttempt.create({
      data: {
        userId: user.id,
        category,
        questionIds,
        expiresAt: new Date(now.getTime() + 15 * 60 * 1000),
      },
    })
    return res.status(201).json(await attemptPayload(attempt))
  } catch (error) {
    console.error('Skill assessment request failed:', error)
    return res.status(500).json({ message: 'Could not load the assessment.' })
  }
}
