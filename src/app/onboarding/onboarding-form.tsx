'use client'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

type Profile = {
  role: 'talent' | 'client'
  firstName: string
  lastName: string
  profession: string
  skills: string[]
  portfolioUrl: string
  bio: string
  companyName: string
  companyIndustry: string
  companyWebsite: string
  companyLocation: string
  onboardingDone: boolean
  phoneVerified: boolean
  telephone: string
}

const emptyProfile: Profile = {
  role: 'talent',
  firstName: '',
  lastName: '',
  profession: '',
  skills: [],
  portfolioUrl: '',
  bio: '',
  companyName: '',
  companyIndustry: '',
  companyWebsite: '',
  companyLocation: '',
  onboardingDone: false,
  phoneVerified: false,
  telephone: '',
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => ({}))
  return body.message || 'Something went wrong. Please try again.'
}

export default function OnboardingForm() {
  const [profile, setProfile] = useState(emptyProfile)
  const [skillsText, setSkillsText] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/onboarding')
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseMessage(response))
        return response.json()
      })
      .then((data: Partial<Profile>) => {
        const nextProfile = { ...emptyProfile, ...data }
        setProfile(nextProfile)
        setSkillsText(nextProfile.skills.join(', '))
        setPhone(nextProfile.telephone)
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof Profile>(field: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [field]: value }))
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          skills: skillsText
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      })
      if (!response.ok) throw new Error(await responseMessage(response))
      setMessage('Your profile has been saved.')
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save your profile.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function verifyPhone(action: 'request' | 'verify') {
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/onboarding/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'request'
            ? { action, phone }
            : { action, code }
        ),
      })
      if (!response.ok) throw new Error(await responseMessage(response))

      if (action === 'request') {
        setMessage('We sent a verification code to your phone.')
      } else {
        update('phoneVerified', true)
        setMessage('Your phone number is verified.')
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Phone verification failed.'
      )
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Build your ResonApp profile
            </Typography>
            <Typography color="text.secondary">
              Tell people what you do so you can find the right projects and
              collaborators.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          {!error.startsWith('Your account has not been imported') && (
            <Box component="form" onSubmit={saveProfile}>
              <Stack spacing={2.5}>
                <FormControl fullWidth>
                  <InputLabel id="profile-role-label">I am here as</InputLabel>
                  <Select
                    labelId="profile-role-label"
                    label="I am here as"
                    value={profile.role}
                    onChange={(event) =>
                      update('role', event.target.value as Profile['role'])
                    }>
                    <MenuItem value="talent">A professional</MenuItem>
                    <MenuItem value="client">A project owner</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    required
                    fullWidth
                    label="First name"
                    value={profile.firstName}
                    onChange={(event) => update('firstName', event.target.value)}
                  />
                  <TextField
                    required
                    fullWidth
                    label="Last name"
                    value={profile.lastName}
                    onChange={(event) => update('lastName', event.target.value)}
                  />
                </Stack>

                {profile.role === 'talent' ? (
                  <>
                    <TextField
                      required
                      label="Primary profession"
                      value={profile.profession}
                      onChange={(event) =>
                        update('profession', event.target.value)
                      }
                    />
                    <TextField
                      required
                      label="Skills"
                      helperText="Separate skills with commas."
                      value={skillsText}
                      onChange={(event) => setSkillsText(event.target.value)}
                    />
                    <TextField
                      label="Portfolio URL"
                      type="url"
                      value={profile.portfolioUrl}
                      onChange={(event) =>
                        update('portfolioUrl', event.target.value)
                      }
                    />
                    <TextField
                      label="About you"
                      multiline
                      minRows={3}
                      value={profile.bio}
                      onChange={(event) => update('bio', event.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <TextField
                      required
                      label="Company or organization"
                      value={profile.companyName}
                      onChange={(event) =>
                        update('companyName', event.target.value)
                      }
                    />
                    <TextField
                      label="Industry"
                      value={profile.companyIndustry}
                      onChange={(event) =>
                        update('companyIndustry', event.target.value)
                      }
                    />
                    <TextField
                      label="Company website"
                      type="url"
                      value={profile.companyWebsite}
                      onChange={(event) =>
                        update('companyWebsite', event.target.value)
                      }
                    />
                    <TextField
                      label="Location"
                      value={profile.companyLocation}
                      onChange={(event) =>
                        update('companyLocation', event.target.value)
                      }
                    />
                  </>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </Button>
              </Stack>
            </Box>
          )}

          {!error.startsWith('Your account has not been imported') && (
            <Box component="section" sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack spacing={2}>
                <Typography variant="h6">Phone verification</Typography>
                <Typography color="text.secondary">
                  Verify your number to strengthen trust. ResonApp stores the
                  verification code as a hash and does not record your SMS.
                </Typography>
                {profile.phoneVerified ? (
                  <Alert severity="success">Your phone is verified.</Alert>
                ) : (
                  <>
                    <TextField
                      label="Phone number"
                      type="tel"
                      placeholder="+14155552671"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      helperText="Use international format, including the + and country code."
                    />
                    <Button
                      variant="outlined"
                      disabled={!phone}
                      onClick={() => verifyPhone('request')}>
                      Send verification code
                    </Button>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Six-digit code"
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                      />
                      <Button
                        variant="outlined"
                        disabled={code.length !== 6}
                        onClick={() => verifyPhone('verify')}>
                        Verify phone
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
