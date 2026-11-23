'use client'

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

type Question = {
  id: string
  prompt: string
  options: unknown
}

type Attempt = {
  attemptId: string
  category: string
  expiresAt: string
  questions: Question[]
}

type Category = {
  name: string
  questionCount: number
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => ({}))
  return body.message || 'Something went wrong. Please try again.'
}

export default function SkillAssessment() {
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState('')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [passed, setPassed] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/skills')
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response))
        return response.json()
      })
      .then((data) => {
        setCategories(data.categories)
        setPassed(data.skillTestPassed)
        if (data.activeAttempt) {
          setAttempt(data.activeAttempt)
          setCategory(data.activeAttempt.category)
        }
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [])

  async function startAssessment() {
    setError('')
    setResult(null)
    setAnswers({})

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      if (!response.ok) throw new Error(await responseMessage(response))
      setAttempt(await response.json())
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not start assessment.'
      )
    }
  }

  async function submitAssessment() {
    if (!attempt) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(
        `/api/skills/attempts/${encodeURIComponent(attempt.attemptId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        }
      )
      if (!response.ok) throw new Error(await responseMessage(response))
      const grade = await response.json()
      setResult({ score: grade.score, passed: grade.passed })
      setPassed(grade.passed)
      setAttempt(null)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not submit assessment.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const allAnswered =
    attempt &&
    attempt.questions.every((question) =>
      Object.prototype.hasOwnProperty.call(answers, question.id)
    )

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography>Loading skill assessments…</Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Skill assessments
            </Typography>
            <Typography color="text.secondary">
              Demonstrate what you know with a short, timed assessment. Your
              answers are graded on the server.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {passed && (
            <Alert severity="success">
              You have earned the verified talent badge by passing an
              assessment.
            </Alert>
          )}
          {result && (
            <Alert severity={result.passed ? 'success' : 'info'}>
              {result.passed
                ? `Passed with ${result.score}%.`
                : `You scored ${result.score}%. 80% is required to pass.`}
            </Alert>
          )}

          {!passed && !attempt && (
            <Stack spacing={2}>
              <FormControl fullWidth>
                <FormLabel id="assessment-category-label">
                  Choose a skill
                </FormLabel>
                <Select
                  aria-labelledby="assessment-category-label"
                  value={category}
                  displayEmpty
                  onChange={(event) => setCategory(event.target.value)}>
                  <MenuItem value="" disabled>
                    Select a category
                  </MenuItem>
                  {categories.map((item) => (
                    <MenuItem key={item.name} value={item.name}>
                      {item.name} ({item.questionCount} questions available)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {categories.length === 0 && (
                <Alert severity="info">
                  Assessments are not available yet. Ask an administrator to
                  run the database seed command.
                </Alert>
              )}
              <Button
                variant="contained"
                size="large"
                disabled={!category || categories.length === 0}
                onClick={startAssessment}>
                Start 15-minute assessment
              </Button>
              <Typography variant="body2" color="text.secondary">
                You have up to three attempts per skill each day. No camera or
                microphone is used.
              </Typography>
            </Stack>
          )}

          {attempt && (
            <Stack spacing={3}>
              <Typography variant="h5">{attempt.category}</Typography>
              <Typography color="text.secondary">
                Complete every question before{' '}
                {new Date(attempt.expiresAt).toLocaleTimeString()}.
              </Typography>
              {attempt.questions.map((question, index) => (
                <FormControl key={question.id}>
                  <FormLabel id={`question-${question.id}`}>
                    {index + 1}. {question.prompt}
                  </FormLabel>
                  <RadioGroup
                    aria-labelledby={`question-${question.id}`}
                    value={answers[question.id]?.toString() ?? ''}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: Number(event.target.value),
                      }))
                    }>
                    {Array.isArray(question.options) &&
                      question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          value={optionIndex.toString()}
                          control={<Radio />}
                          label={String(option)}
                        />
                      ))}
                  </RadioGroup>
                </FormControl>
              ))}
              <Button
                variant="contained"
                size="large"
                disabled={!allAnswered || submitting}
                onClick={submitAssessment}>
                {submitting ? 'Submitting…' : 'Submit answers'}
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
