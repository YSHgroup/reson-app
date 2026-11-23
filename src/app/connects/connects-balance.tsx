'use client'

import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

type PurchaseInfo = {
  balance: number
  connects: number
  priceCents: number
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => ({}))
  return body.message || 'Something went wrong. Please try again.'
}

export default function ConnectsBalance({
  checkoutState,
}: {
  checkoutState: string
}) {
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null)
  const [startingBalance, setStartingBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const loadBalance = useCallback(async () => {
    const response = await fetch('/api/connects')
    if (!response.ok) throw new Error(await responseMessage(response))
    const data: PurchaseInfo = await response.json()
    setPurchaseInfo(data)
    setStartingBalance((current) => current ?? data.balance)
    return data.balance
  }, [])

  useEffect(() => {
    loadBalance()
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false))
  }, [loadBalance])

  useEffect(() => {
    if (checkoutState !== 'success' || startingBalance === null) return

    let checks = 0
    const interval = setInterval(() => {
      checks += 1
      loadBalance()
        .then((balance) => {
          if (balance > startingBalance || checks >= 30) {
            clearInterval(interval)
          }
        })
        .catch((cause: Error) => {
          setError(cause.message)
          clearInterval(interval)
        })
    }, 2_000)

    return () => clearInterval(interval)
  }, [checkoutState, loadBalance, startingBalance])

  async function beginCheckout() {
    setCheckingOut(true)
    setError('')
    try {
      const response = await fetch('/api/connects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' }),
      })
      if (!response.ok) throw new Error(await responseMessage(response))
      const { checkoutUrl }: { checkoutUrl: string } = await response.json()
      window.location.assign(checkoutUrl)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not start checkout.'
      )
      setCheckingOut(false)
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 8 } }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Connects
            </Typography>
            <Typography color="text.secondary">
              Use Connects to apply to projects that are right for you.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {checkoutState === 'success' && (
            <Alert severity="info">
              Payment is processing. Your balance updates after Stripe confirms
              the purchase.
            </Alert>
          )}
          {checkoutState === 'cancelled' && (
            <Alert severity="info">Checkout was cancelled; no Connects were charged.</Alert>
          )}

          {loading ? (
            <Typography>Loading your balance…</Typography>
          ) : (
            <>
              <Box>
                <Typography variant="overline">Available balance</Typography>
                <Typography variant="h2">
                  {purchaseInfo?.balance ?? 0}
                </Typography>
                <Typography color="text.secondary">Connects</Typography>
              </Box>
              {purchaseInfo && (
                <Button
                  variant="contained"
                  size="large"
                  disabled={checkingOut}
                  onClick={beginCheckout}>
                  {checkingOut
                    ? 'Opening secure checkout…'
                    : `Buy ${purchaseInfo.connects} Connects for $${(
                        purchaseInfo.priceCents / 100
                      ).toFixed(2)}`}
                </Button>
              )}
              <Typography variant="body2" color="text.secondary">
                Payments are handled by Stripe. Connects are added only after
                payment is confirmed.
              </Typography>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
