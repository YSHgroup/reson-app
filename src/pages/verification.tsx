import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import NextLink from 'next/link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import React from 'react'
import CenterLayout from '@layouts/CenterLayout'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import Backdrop from '@mui/material/Backdrop'
import CircularProgress from '@mui/material/CircularProgress'
import { NextApiRequest } from 'next'
import { useAtom } from 'jotai'
import languagejson from "../language.json"
import {language, tempEmailJot} from "../state"
import cookies from "browser-cookies";


export default function SignIn() {
  const [tempEmail, setTempEmail] = useAtom(tempEmailJot)
  const [verificationCode, setVerificationCode] = React.useState('')
  const [isLoading, setLoading] = React.useState(false)

  const verify = async() => {
    setLoading(true)
    const v_code = {
      verificationCode,
      tempEmail
    }
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(v_code),
    })
  }
  return (
    <CenterLayout title="Verification">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column'
        }}>
        <Typography component="h1" variant="h5">
          Congrate, we sent verification link to your email address.
        </Typography>
      </Box>
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </CenterLayout>
  )
}
