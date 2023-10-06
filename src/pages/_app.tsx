import * as React from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import {
  PaletteMode,
  ThemeProvider,
  createTheme,
  Snackbar,
  Alert,
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
import { language } from "../jotai"
import Worker from "../components/worker";
import Particles from "react-tsparticles";
import type { Container, Engine } from "tsparticles-engine";
import { loadSlim } from "tsparticles-slim";

type LanguageType = number; // Replace 'number' with the actual type of your language state

export default function App({ Component, pageProps }: AppProps) {
  const [lang, setLanguage] = useAtom<LanguageType>(language)
  const [mode, setMode] = React.useState<PaletteMode>('dark')
  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        setMode((prevMode: PaletteMode) =>
          prevMode === 'light' ? 'dark' : 'light'
        )
      },
      mode,
    }),
    [mode]
  );

  const particlesInit = React.useCallback(async (engine: Engine) => {
    console.log(engine);
    // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    //await loadFull(engine);
    await loadSlim(engine);
  }, []);

  const particlesLoaded = React.useCallback(async (container: Container | undefined) => {
    // await console.log(container);
  }, []);

  // Update the theme only if the mode changes
  const theme = React.useMemo(
    () => {
      // const customProps = (mode === "dark") ? {
      //   background: {
      //     default: "#b42b2b",
      //     paper: "#b42b2b"
      //   }
      // } : {
      //   background: {
      //     default: "#222",
      //     paper: "#222"
      //   }
      // };
      return createTheme({
        palette: {
          mode,
          // ...customProps
        }
      });
    },
    [mode]
  )

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
    const local: any = localStorage.getItem('language');
    const storedValue: any = parseInt(local) || 0;
    if (storedValue) {
      setLanguage(storedValue as LanguageType);
    }

  }, []);

  return (
    <LocalizationProvider dateAdapter={DateFnsUtils}>
      <ColorModeContext.Provider value={colorMode}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
              image: mode === "dark" ? "url('/images/background.jpg')" : "radial-gradient(#F1F0F0)",
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: "repulse",
                },
                onHover: {
                  enable: true,
                  mode: "repulse",
                },
                resize: true,
              },
              modes: {
                push: {
                  quantity: 4,
                },
                repulse: {
                  distance: 150,
                  duration: 0.4,
                },
              },
            },
            particles: {
              color: {
                value: mode === "dark" ? "#66B1D9" : "#828E8E",
              },
              links: {
                color: mode === "dark" ? "#66B1D9" : "#828E8E",
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 4,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 60,
              },
              opacity: {
                value: 0.9,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 5 },
              },
            },
            detectRetina: true,
          }}
        />
        <ThemeProvider theme={theme}>
          <SessionProvider session={pageProps.session}>
            <JotaiProvider>
              <SnackbarContext.Provider
                value={{
                  snack,
                  setSnack,
                }}>
                <Head>
                  <meta name="description" content="Reson App" />
                  <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                  />
                  <link rel="icon" href="/favicon.png" />
                </Head>
                <Component {...pageProps} />
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
              </SnackbarContext.Provider>
            </JotaiProvider>
            <Worker />
          </SessionProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </LocalizationProvider>
  )
}
