import * as React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import {
  PaletteMode,
  ThemeProvider,
  createTheme,
  Snackbar,
  Alert,
  CssBaseline,
} from '@mui/material'
import '../styles/globals.scss'
import '../styles/globals.css'
import '../styles/search.css'
import '../styles/create.css'
import ColorModeContext from 'context/ColorModeContext'
import { SessionProvider } from 'next-auth/react'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import DateFnsUtils from '@date-io/date-fns'
import { useAtom, Provider as JotaiProvider } from 'jotai'
import { dateColorJot, language, modusJot } from '../jotai'
import Worker from '../components/worker'
import { VideoCallProvider } from 'context/VideoCallContext'
import VideoCallWindow from '@elements/Chat/VideoCallWindowComponent'
import ParticlesComponent from '@elements/Particles'
import { darkTheme, lightTheme, defaultTheme } from 'theme'
import CustomScrollbar from '@elements/CustomScrollbar'
import { GenNumForDate } from 'classes/GenNumForDate'
import { dateColor } from '@constants/Status'

type LanguageType = number // Replace 'number' with the actual type of your language state

// Customize the PaletteMode type to add the value of 'default'
type CustomizePaletteMode = PaletteMode | 'default'

export default function App({ Component, pageProps }: AppProps) {
  const [lang, setLanguage] = useAtom<LanguageType>(language)
  const [modus] = useAtom(modusJot)
  // const modeFromStorage = localStorage.getItem('color_mode')
  // const [mode, setMode] = React.useState<CustomizePaletteMode>(
  //   modeFromStorage === 'default' ||
  //     modeFromStorage === 'light' ||
  //     modeFromStorage === 'dark'
  //     ? modeFromStorage
  //     : 'default'
  // )
  const numForDate = new GenNumForDate()

  console.log('num For Date--- ', numForDate.currentDate, numForDate.getNum())
  const [mode, setMode] = React.useState<CustomizePaletteMode>('default')
  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: CustomizePaletteMode) =>
          prevMode === 'default'
            ? 'dark'
            : prevMode === 'dark'
            ? 'light'
            : 'default'
        )
      },
      mode,
      setColorMode: (value) => {
        setMode(value)
      }
    }),
    [mode]
  )
  React.useEffect(() => {
    const modeState = ['dark', 'light', 'default']
    const getCurrentSetting = async () => {
      const response = await fetch('/api/setting/currentSetting', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      let settingData = await response.json()
      const indexOfMode = Number(settingData.data.modus)
      setMode(modeState[indexOfMode] as CustomizePaletteMode)
    }
    getCurrentSetting()
  }, [])
  React.useEffect(() => {
    localStorage.setItem('color_mode', mode)

  }, [mode])

  // Update the theme only if the mode changes
  const theme = React.useMemo(() => {
    const customProps =
      mode === 'dark' ? darkTheme : mode === 'light' ? lightTheme : defaultTheme
    return customProps
  }, [mode])


  const [snack, setSnack] = React.useState(
    new Snack({
      open: false,
    })
  )

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }

    setSnack(
      new Snack({
        color: snack.color,
        open: false,
      })
    )
  }

  React.useEffect(() => {
    const localLanguage = localStorage.getItem('language')
    // if (localLanguage) {
    //   setLanguage(parseInt(localLanguage))
    // }
  }, [])

  return (
    <LocalizationProvider dateAdapter={DateFnsUtils}>
      <ColorModeContext.Provider value={colorMode}>
        <ParticlesComponent mode={mode} />
        <ThemeProvider theme={theme}>
          <SessionProvider session={pageProps.session}>
            <JotaiProvider>
              <VideoCallProvider>
                <SnackbarContext.Provider
                  value={{
                    snack,
                    setSnack,
                  }}>
                  <Head>
                    <title>ResonApp</title>
                  </Head>
                  <CustomScrollbar>
                  <CssBaseline/>
                  <Component {...pageProps} />
                  <VideoCallWindow />
                  <Snackbar
                    open={snack.open}
                    autoHideDuration={snack.autoHideDuration}
                    onClose={handleClose}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}>
                    <Alert
                      onClose={handleClose}
                      severity={snack.color}
                      sx={{
                        width: '100%',
                      }}>
                      {snack.message || 'A New Message'}
                    </Alert>
                  </Snackbar>
                  </CustomScrollbar>
                </SnackbarContext.Provider>
              </VideoCallProvider>
            </JotaiProvider>
            <Worker />
          </SessionProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </LocalizationProvider>
  )
}
