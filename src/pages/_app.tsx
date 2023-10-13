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
import { useRouter } from 'next/router'
import ColorModeContext from 'context/ColorModeContext'
import { SessionProvider } from 'next-auth/react'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import { LocalizationProvider } from '@mui/x-date-pickers'
import DateFnsUtils from '@date-io/date-fns'
import { useAtom, Provider as JotaiProvider } from 'jotai'
import { language } from '../jotai'
import Worker from '../components/worker'
import Particles from 'react-tsparticles'
import type { Container, Engine } from 'tsparticles-engine'
import { loadSlim } from 'tsparticles-slim'
import {
  useBeingCalled,
  useCallAccepted,
  useCallStatusRef,
  useCallerSignal,
  useConnection,
  useIsCalling,
  useIsCallingRef,
  useLocalStream,
  useLocalStreamRef,
  useMessages,
  useMinimizeCall,
  useMyAudio,
  useOpenSnack,
  usePic,
  useRemoteStream,
  useRemoteStreamRef,
  useSnackText,
} from 'hooks/useChat'
import { VideoCallWindow } from '@elements/Chat/VideoCallWindow'
import io from 'socket.io-client'
import Peer from 'simple-peer'

type LanguageType = number // Replace 'number' with the actual type of your language state

let socket: any

let peer: any

const beaks = [
  '/audios/ring1.mp3',
  '/audios/ring2.mp3',
  '/audios/ring3.mp3',
  '/audios/ring4.mp3',
]
let audio1: HTMLAudioElement,
  audio2: HTMLAudioElement,
  audio3: HTMLAudioElement,
  audio4: HTMLAudioElement

export default function App({ Component, pageProps }: AppProps) {
  const [lang, setLanguage] = useAtom<LanguageType>(language)
  const [mode, setMode] = React.useState<PaletteMode>('dark')
  const router = useRouter()
  const { email } = router.query

  const { isCalling, setIsCalling } = useIsCalling()
  const { beingCalled, setBeingCalled } = useBeingCalled()
  const { pic, setPic } = usePic()
  const { localStream, setLocalStream } = useLocalStream()
  const { remoteStream, setRemoteStream } = useRemoteStream()
  const { callAccepted, setCallAccepted } = useCallAccepted()
  const { minimizeCall, setMinimizeCall } = useMinimizeCall()
  const { callerSignal, setCallerSignal } = useCallerSignal()
  const localStreamRef = useLocalStreamRef()
  const remoteStreamRef = useRemoteStreamRef()
  const myAudio = useMyAudio()
  const connection = useConnection()
  const { openSnack, setOpenSnack } = useOpenSnack()
  const { snackText, setSnackText } = useSnackText()
  const callStatusRef = useCallStatusRef()
  const isCallingRef = useIsCallingRef()
  const { messages, setMessages } = useMessages()

  const { data: session } = pageProps.session

  const acceptCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream: any) => {
        setLocalStream(stream)
        localStreamRef.current = stream
        setCallAccepted(true)
        audio2.pause()
        audio3.play()
        peer = new Peer({
          initiator: false,
          trickle: false,
          stream: localStreamRef.current,
        })
        const from = session?.user?.email
        peer.on('signal', (signal: any) => {
          socket.emit('acceptCall', { signal: signal, to: email, from })
        })
        peer.on('stream', (stream: any) => {
          setRemoteStream(stream)
          remoteStreamRef.current = stream
          myAudio.current.srcObject = stream
        })

        peer.on('close', () => {
          handleCloseVideoCall()
          alert('opposite user ended the call.')
        })

        if (callerSignal) peer.signal(callerSignal)
        connection.current = peer
      })
      .catch((error) => {
        console.error('Error accessing media devices....', error)
        // alert(error)
        setSnackText(`${error}`)
        setOpenSnack(true)
      })
  }

  const handleCloseVideoCall = (flag: Boolean = true) => {
    localStream?.getTracks().forEach((track) => track.stop())
    remoteStream?.getTracks().forEach((track) => track.stop())
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop())
    audio1.pause()
    audio2.pause()
    audio4.play()
    localStream?.getAudioTracks()[0].stop()
    remoteStream?.getAudioTracks()[0].stop()
    localStreamRef.current?.getAudioTracks()[0].stop()
    remoteStreamRef.current?.getAudioTracks()[0].stop()
    localStreamRef.current = undefined
    remoteStreamRef.current = undefined
    setLocalStream(undefined)
    setRemoteStream(undefined)
    setIsCalling(false)
    setMinimizeCall(false)
    isCallingRef.current = false
    setCallAccepted(false)
    setBeingCalled(false)
    if (callStatusRef.current) {
      getMsgs()
    }
    if (callStatusRef.current == 'caller') {
      socket.emit('missedCall', { to: email })
    }
    callStatusRef.current = undefined
    if (flag) {
      const from = session?.user?.email
      socket.emit('destroyP2P', { to: email, from })
    }
    // peer.destroy();
  }
  const getMsgs = async () => {
    const res = await fetch('/api/message/getMsgs', {
      method: 'POST',
      body: JSON.stringify({ OppositeEmail: email }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resData = await res.json()
    setMessages(resData.msgs)
  }

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
  )

  const particlesInit = React.useCallback(async (engine: Engine) => {
    // you can initialize the tsParticles instance (engine) here, adding custom shapes or presets
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    //await loadFull(engine);
    await loadSlim(engine)
  }, [])

  const particlesLoaded = React.useCallback(
    async (container: Container | undefined) => {
      // await console.log(container);
    },
    []
  )

  // Update the theme only if the mode changes
  const theme = React.useMemo(() => {
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
      },
    })
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
  console.log(isCalling)
  React.useEffect(() => {
    const local: any = localStorage.getItem('language')
    const storedValue: any = parseInt(local) || 0
    if (storedValue) {
      setLanguage(storedValue as LanguageType)
    }
    audio1 = new Audio(beaks[0])
    audio2 = new Audio(beaks[1])
    audio3 = new Audio(beaks[2])
    audio4 = new Audio(beaks[3])
  }, [])

  return (
    <LocalizationProvider dateAdapter={DateFnsUtils}>
      <ColorModeContext.Provider value={colorMode}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            background: {
              image:
                mode === 'dark'
                  ? "url('/images/background.jpg')"
                  : 'radial-gradient(#F1F0F0)',
            },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: 'repulse',
                },
                onHover: {
                  enable: true,
                  mode: 'repulse',
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
                value: mode === 'dark' ? '#66B1D9' : '#828E8E',
              },
              links: {
                color: mode === 'dark' ? '#66B1D9' : '#828E8E',
                distance: 150,
                enable: true,
                opacity: 0.5,
                width: 1,
              },
              move: {
                direction: 'none',
                enable: true,
                outModes: {
                  default: 'bounce',
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
                type: 'circle',
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
            {(isCalling || beingCalled) && !minimizeCall ? (
              <VideoCallWindow
                pic={pic}
                localStream={localStream}
                remoteStream={remoteStream}
                callAccepted={callAccepted}
                videoWindowClosed={handleCloseVideoCall}
                acceptCall={acceptCall}
                minimize={(val: boolean) => {
                  setMinimizeCall(val)
                }}
              />
            ) : (
              <></>
            )}
            <Worker />
          </SessionProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </LocalizationProvider>
  )
}
