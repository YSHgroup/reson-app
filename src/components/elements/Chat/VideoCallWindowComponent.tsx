import React, { useState, useEffect, useRef, useContext } from 'react'
import { Minimize, CallEnd, PhoneEnabled } from '@mui/icons-material'
import Fab from '@mui/material/Fab'
import { Close } from '@mui/icons-material'
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress'
import Snackbar from '@mui/material/Snackbar'

import { Stack } from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import { VideoCallContext } from 'context/VideoCallContext'
import SnackbarContext, { Snack } from 'context/SnackbarContext'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

let socket: any

// type Message = {
//     author: string;
//     message: string;
// };

const ICE_SERVERS = [
  // Add more STUN and TURN servers here
  { urls: 'stun:stun.l.google.com:19302' },
]

const AUDIO_CONSTRAINTS = { audio: true, video: false }
const VIDEO_CONSTRAINTS = {
  audio: false,
  video: {
    deviceId: {
      exact: 'a3537551792d9bbb19b8de90745903edf56fecc1f175b3a988b7b537421469eb',
    },
  },
}

const beaks = [
  '/audios/ring1.mp3',
  '/audios/ring2.mp3',
  '/audios/ring3.mp3',
  '/audios/ring4.mp3',
]
// let audio1: HTMLAudioElement,
//   audio2: HTMLAudioElement,
//   audio3: HTMLAudioElement,
//   audio4: HTMLAudioElement

let callLabel = ['Canceled call', 'Declined call', 'Outgoing call']

let callLabel_ = ['Missed call', 'Declined call', 'Incoming call']

const VideoCallWindow = () => {
  const router = useRouter()
  const { setSnack } = useContext(SnackbarContext)
  const { data: session } = useSession()
  const [pic, setPic] = useState('')
  const [inputValue, setInputValue] = useState<string>('')
  const [messages, setMessages] = useState<Array<any>>([])
  const {
    isCalling,
    setIsCalling,
    beingCalled,
    setBeingCalled,
    minimizeCall,
    setMinimizeCall,
    snackText,
    setSnackText,
    audio1,
    audio2,
    audio3,
    audio4,
    toChat,
    setToChat,
    fromChat,
    setFromChat,
  } = useContext(VideoCallContext)

  const [socketId, setSocketId] = useState<string | null>(null)
  const [callAccepted, setCallAccepted] = useState(false)
  const [callerSignal, setCallerSignal] = useState<any | null>(null)
  const [receiverSignal, setReceiverSignal] = useState<any | null>(null)
  const myAudio = useRef<any>(null)

  const isCallingRef = useRef<any>(false)
  const localStreamRef = useRef<any | undefined>(undefined)
  const remoteStreamRef = useRef<any | undefined>(undefined)
  const callStatusRef = useRef<any | undefined>(undefined)
  const callIdRef = useRef<any | undefined>(undefined)
  const initiatorPeerRef = useRef<any | undefined>(undefined)
  const receiverPeerRef = useRef<any | undefined>(undefined)

  const fetchData = async () => {
    if (toChat === '' || fromChat === '') return
    const responseData = { email: toChat }
    try {
      const response = await fetch('/api/user/getuser', {
        method: 'POST',
        body: JSON.stringify(responseData),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const res = await response.json()
      setPic(res.data[0].picpath)
    } catch (error) {
      console.log(error)
    }
  }
  const initiateCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream: any) => {
        localStreamRef.current = stream
        audio1.current.play()
        audio1.current.loop = true
        setIsCalling(true)
        isCallingRef.current = true
        const from = session?.user?.email
        initiatorPeerRef.current = undefined
        initiatorPeerRef.current = new Peer({
          initiator: true,
          trickle: false,
          stream: localStreamRef.current,
          config: { iceServers: ICE_SERVERS },
        })
        initiatorPeerRef.current.on('signal', async (signal: any) => {
          // console.log(isCallingRef.current, 'isCallingRef.current')
          if (isCallingRef.current) {
            socket.emit('callUser', {
              signal: signal,
              to: toChat,
              from: fromChat,
            })
            // New Call Record
            callStatusRef.current = 'caller'
            const payload = {
              to: fromChat,
            }
            const res = await fetch('/api/message/newCall', {
              method: 'POST',
              body: JSON.stringify(payload),
              headers: {
                'Content-Type': 'application/json',
              },
            })
            const resData = await res.json()
            callIdRef.current = resData.newCallInfo.insertedId
          }
        })

        initiatorPeerRef.current.on('stream', (stream: MediaStream) => {
          remoteStreamRef.current = stream
          myAudio.current.srcObject = stream
        })

        initiatorPeerRef.current.on('close', () => {
          handleCloseVideoCall()
          alert('opposite user ended the call.')
        })

        socket.on('acceptCall', (data: any) => {
          console.log('acceptCall')
          setCallAccepted(true)
          callStatusRef.current = 'receivedCall'
          fetch('/api/message/receivedCall', {
            method: 'POST',
            body: JSON.stringify({ callId: callIdRef.current }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((response) => response.json())
            .then((data) => {
              // setCallId(data.newCallInfo.insertedId);
            })
          setSnack(
            new Snack({
              message: `${toChat} accepted your call`,
              color: 'success',
              open: true,
            })
          )
          // alert(`${email} accepted your call`)
          setReceiverSignal(null)
          setReceiverSignal(data.signal)
          console.log(initiatorPeerRef.current, "initiatorPeerRef.current")
          audio1.current.pause()
          audio3.current.play()
          initiatorPeerRef.current.signal(data.signal)
          console.log(initiatorPeerRef.current, "initiatorPeerRef.current========")

        })
        socket.on('busy', (data: any) => {
          handleCloseVideoCall(false)
          setSnack(
            new Snack({
              message: `${data.from} is busy now.`,
              color: 'success',
              open: true,
            })
          )
        })
      })
      .catch((error) => {
        console.error('Error accessing media devices....', error)
        // alert(error)
        setIsCalling(false)
        setSnack(
          new Snack({
            message: "Not found media device",
            color: 'error',
            open: true,
          })
        )
      })
  }

  useEffect(() => {
    if (isCalling && fromChat !== '' && toChat !== '') {
      fetchData()
      initiateCall()
    }
  }, [isCalling, fromChat])
  useEffect(() => {
    audio1.current = new Audio(beaks[0])
    audio2.current = new Audio(beaks[1])
    audio3.current = new Audio(beaks[2])
    audio4.current = new Audio(beaks[3])
    socket = io(`${String(process.env.NEXT_PUBLIC_CHAT_URI)}/chatCall`, {
      secure: true,
    })
    socket.on('connect', () => {
      // Fetch existing messages from the server
      socket.emit('emailMapId', { email: session?.user?.email })
      // socket.emit('getMessages', { to: email, author: session?.user?.email });
    })
    socket.on('getid', (sockId: string) => {
      setSocketId(sockId)
    })
    socket.on('callingMe', (data: any) => {
      if (isCallingRef.current) {
        socket.emit('Iambusy', { from: data.to, to: data.from })
      } else {
        setToChat(data.from)
        setFromChat(data.to)
        callStatusRef.current = 'callee'
        setBeingCalled(true)
        setSnack(
          new Snack({
            message: `${data.from} is calling you.`,
            color: 'success',
            open: true,
          })
        )
        setCallerSignal(data.signal)
        audio2.current.play()
        audio2.current.loop = true
      }
    })
    socket.on('destroyP2P', (data: any) => {
      if (callStatusRef.current == 'caller') {
        fetch('/api/message/declinedCall', {
          method: 'POST',
          body: JSON.stringify({ callId: callIdRef.current }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json())
          .then((resdata) => {
            // setCallId(data.newCallInfo.insertedId);
          })
      }
      handleCloseVideoCall(false)
    })
  }, [])

  const acceptCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream: any) => {
        localStreamRef.current = stream
        setCallAccepted(true)
        audio2.current.pause()
        audio3.current.play()
        console.log(receiverPeerRef.current, 'receiverPeerRef.current')
        receiverPeerRef.current = undefined
        receiverPeerRef.current = new Peer({
          initiator: false,
          trickle: false,
          stream: localStreamRef.current,
        })
        receiverPeerRef.current.on('signal', (signal: any) => {
          socket.emit('acceptCall', {
            signal: signal,
            to: toChat,
            from: fromChat,
          })
        })
        receiverPeerRef.current.on('stream', (stream: any) => {
          remoteStreamRef.current = stream
          myAudio.current.srcObject = stream
        })

        receiverPeerRef.current.on('close', () => {
          handleCloseVideoCall()
          alert('opposite user ended the call.')
        })

        if (callerSignal) {
          receiverPeerRef.current.signal(callerSignal)
        }
      })
      .catch((error) => {
        console.error('Error accessing media devices....', error)
        // alert(error)
        setSnack(
          new Snack({
            message: "Not found media device",
            color: 'error',
            open: true,
          })
        )
      })
  }

  const handleCloseVideoCall = (flag: Boolean = true) => {
    localStreamRef.current
      ?.getTracks()
      .forEach((track: { stop: () => any }) => track.stop())
    remoteStreamRef.current
      ?.getTracks()
      .forEach((track: { stop: () => any }) => track.stop())
    audio1.current.pause()
    audio2.current.pause()
    audio4.current.play()
    localStreamRef.current?.getAudioTracks()[0].stop()
    remoteStreamRef.current?.getAudioTracks()[0].stop()
    localStreamRef.current = undefined
    remoteStreamRef.current = undefined
    setIsCalling(false)
    setMinimizeCall(false)
    isCallingRef.current = false
    setCallAccepted(false)
    setBeingCalled(false)
    if (callStatusRef.current == 'caller') {
      socket.emit('missedCall', { to: toChat })
    }
    callStatusRef.current = undefined
    if (flag) {
      const from = session?.user?.email
      socket.emit('destroyP2P', { to: toChat, from })
    }
    setSnackText('')
    if (receiverPeerRef.current) {
      // receiverPeerRef.current.removeListener('signal', callerSignal)
      receiverPeerRef.current.destroy()
    }
    setCallerSignal(null)
    receiverPeerRef.current = undefined
    if (initiatorPeerRef.current) {
      // initiatorPeerRef.current.removeListener('signal', receiverSignal)
      initiatorPeerRef.current.destroy()
    }
    setReceiverSignal(null)
    myAudio.current = null
    callIdRef.current = undefined
    initiatorPeerRef.current = undefined
    setFromChat('')
    setToChat('')
    // peer.destroy();
  }

  const onCallEnd = () => {
    handleCloseVideoCall()
  }
  const answerCall = () => {
    acceptCall()
  }

  return (
    <>
      {(isCalling || beingCalled) && !minimizeCall && (
        <div
          style={{
            position: 'fixed',
            zIndex: 1000,
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <div
            style={{
              width: '640px',
              height: '480px',
              objectFit: 'cover',
              borderRadius: '4px',
              border: '2px solid #312f41',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18151c',
            }}>
            <div
              style={{
                textAlign: 'center',
                marginTop: '5px',
                fontWeight: 'bold',
              }}>
              {toChat}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'Center',
                flexGrow: 1,
              }}>
              <Image
                style={{
                  alignSelf: 'center',
                  border: '1px solid #6e6a91',
                  borderRadius: '50%',
                  width: '240px',
                  height: '240px',
                  padding: '4px',
                }}
                src={
                  pic == '' || pic == undefined
                    ? `/images/male.png`
                    : `/api/view?name=chats/${pic}`
                }
                alt="male"
                width={70}
                height={70}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'Center',
              }}>
              {!callAccepted && !isCalling && (
                <Fab
                  style={{ backgroundColor: 'green', marginRight: '25px' }}
                  aria-label="add">
                  <PhoneEnabled
                    onClick={answerCall}
                    sx={{ color: 'white', fontSize: '45px' }}
                  />
                </Fab>
              )}
              <Fab style={{ backgroundColor: '#af0000' }} aria-label="add">
                <CallEnd
                  onClick={onCallEnd}
                  sx={{ color: 'white', fontSize: '45px' }}
                />
              </Fab>
            </div>
            <div style={{ marginTop: '20px' }}>
              {callAccepted || <LinearProgress color="success" />}
            </div>
          </div>
          <Stack
            direction="row"
            style={{
              position: 'absolute',
              cursor: 'pointer',
              top: '10px',
              right: '10px',
              color: 'white',
            }}>
            <Minimize
              onClick={() => setMinimizeCall(true)}
              sx={{ fontSize: '32px' }}
            />
            <Close onClick={onCallEnd} sx={{ fontSize: '32px' }} />
          </Stack>
          {callAccepted ? (
            <audio playsInline ref={myAudio} autoPlay hidden />
          ) : null}
        </div>
      )}
    </>
  )
}

export default VideoCallWindow
