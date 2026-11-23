import { getServerSession } from 'next-auth/next'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { SkillAttemptStatus } from '../../../../generated/prisma/client'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@lib/prisma'

const submissionSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(20)),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ message: 'Method not allowed.' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    const email = session?.user?.email?.trim().toLowerCase()
    if (!email) return res.status(401).json({ message: 'Sign in to continue.' })

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (!user) {
      return res.status(409).json({
        message: 'Your account has not been imported into the new profile service yet.',
      })
    }

    const attemptId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
    const parsed = submissionSchema.safeParse(req.body)
    if (!attemptId || !parsed.success) {
      return res.status(422).json({ message: 'Submit an answer for each question.' })
    }

    const attempt = await prisma.skillAttempt.findFirst({
      where: { id: attemptId, userId: user.id },
    })
    if (!attempt) return res.status(404).json({ message: 'Assessment not found.' })
    if (attempt.status !== SkillAttemptStatus.IN_PROGRESS) {
      return res.status(409).json({ message: 'This assessment is already complete.' })
    }
    if (attempt.expiresAt <= new Date()) {
      await prisma.skillAttempt.updateMany({
        where: {
          id: attempt.id,
          userId: user.id,
          status: SkillAttemptStatus.IN_PROGRESS,
        },
        data: {
          status: SkillAttemptStatus.FAILED,
          completedAt: new Date(),
        },
      })
      return res.status(410).json({ message: 'Your assessment time has expired.' })
    }

    const answers = parsed.data.answers
    const answerIds = Object.keys(answers).sort()
    const expectedIds = [...attempt.questionIds].sort()
    if (
      answerIds.length !== expectedIds.length ||
      answerIds.some((id, index) => id !== expectedIds[index])
    ) {
      return res.status(422).json({
        message: 'Submit exactly one answer for every assessment question.',
      })
    }

    const questions = await prisma.skillQuestion.findMany({
      where: { id: { in: attempt.questionIds } },
      select: { id: true, correctIndex: true, options: true },
    })
    if (questions.length !== attempt.questionIds.length) {
      return res.status(409).json({
        message: 'An assessment question is no longer available.',
      })
    }

    for (const question of questions) {
      const options = question.options
      if (
        !Array.isArray(options) ||
        answers[question.id] >= options.length
      ) {
        return res.status(422).json({
          message: 'One or more selected answers are invalid.',
        })
      }
    }

    const correct = questions.reduce(
      (score, question) =>
        score + Number(answers[question.id] === question.correctIndex),
      0
    )
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= 80
    const result = await prisma.$transaction(async (transaction) => {
      const submitted = await transaction.skillAttempt.updateMany({
        where: {
          id: attempt.id,
          userId: user.id,
          status: SkillAttemptStatus.IN_PROGRESS,
          expiresAt: { gt: new Date() },
        },
        data: {
          answers,
          score,
          status: passed
            ? SkillAttemptStatus.PASSED
            : SkillAttemptStatus.FAILED,
          completedAt: new Date(),
        },
      })
      if (submitted.count === 0) return false

      if (passed) {
        await transaction.user.update({
          where: { id: user.id },
          data: { skillTestPassed: true, talentBadge: true },
        })
      }
      return true
    })

    if (!result) {
      return res.status(409).json({
        message: 'This assessment has expired or has already been submitted.',
      })
    }

    return res.status(200).json({ score, passed, correct, total: questions.length })
  } catch (error) {
    console.error('Skill assessment submission failed:', error)
    return res.status(500).json({ message: 'Could not grade your assessment.' })
  }
}
