import * as React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import BasicLayout from '@layouts/BasicLayout/BasicLayout'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Image from 'next/image'
import Menubar from '@elements/Menubar'
import { useRouter } from 'next/router'
import {
  language,
  modusJot,
  statusJot,
  firstnameJot,
  lastnameJot,
  emailJot,
  telephoneJot,
  personalAnalysisJot,
} from '../../../state'
import { useAtom } from 'jotai'

type FullLayoutProps = {
  children: React.ReactNode
  title?: string
  appbar?: boolean
  menubar?: boolean
}

export default function FullLayout({
  children,
  title = 'Reson App',
  appbar = true,
  menubar = true,
}: FullLayoutProps) {
  const [lang, setLanguage] = useAtom(language)
  const [modus, setModus] = useAtom(modusJot)
  const [status, setStatus] = useAtom(statusJot)
  const [firstname, setFirstname] = useAtom(firstnameJot)
  const [lastname, setLastname] = useAtom(lastnameJot)
  const [email, setEmail] = useAtom(emailJot)
  const [telephone, setTelephone] = useAtom(telephoneJot)
  const [personalAnalysis, setPersonalAnalysis] = useAtom(personalAnalysisJot)

  const router = useRouter()
  const handleClose = () => {
    let settingData = {
      lang,
      modus,
      status,
      firstname,
      lastname,
      email,
      telephone,
      personalAnalysis,
    }
    if (router.pathname.substring(1, router.pathname.length) == 'settings') {
      fetch('/api/setting/setting', {
        method: 'POST',
        body: JSON.stringify(settingData),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => console.log(res))
    }
    router.replace('/dashboard')
  }
  return (
    <BasicLayout title={title}>
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
        <CssBaseline />
        {appbar && (
          <AppBar position="static">
            <Toolbar>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  flexGrow: 1,
                }}>
                {title}
              </Typography>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleClose}>
                <Image
                  src="/images/back.png"
                  alt="back"
                  width={26}
                  height={26}
                  />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        <Box
          sx={{
            overflow: 'auto',
            overflowX: 'hidden',
            flexGrow: 1,
            width: '100%',
          }}>
          {children}
        </Box>
        {menubar && <Menubar />}
      </Box>
    </BasicLayout>
  )
}
