import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from 'react'
import {
  Minimize,
  CallEnd,
  PhoneEnabled,
  Videocam,
  VideocamOff,
} from '@mui/icons-material'
import Fab from '@mui/material/Fab'
import { Close } from '@mui/icons-material'
import LinearProgress from '@mui/material/LinearProgress'
import { Button, Stack } from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import io, { type Socket } from 'socket.io-client'
import { VideoCallContext } from 'context/VideoCallContext'
import SnackbarContext, { Snack } from 'context/SnackbarContext'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

function getIceServers(): RTCIceServer[] {
  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS?.split(',')
    .map((url) => url.trim())
    .filter(Boolean)
  const iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
  ]

  if (turnUrls?.length) {
    const username = process.env.NEXT_PUBLIC_TURN_USERNAME
    const credential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL
    if (!username || !credential) {
      console.error(
        'TURN URLs are configured but TURN username or credential is missing.'
      )
    } else {
      iceServers.push({ urls: turnUrls, username, credential })
    }
  }

  return iceServers
}
const beaks = [
  '/audios/ring1.mp3',
  '/audios/ring2.mp3',
  '/audios/ring3.mp3',
  '/audios/ring4.mp3',
]

type WebRTCUser = {
  id: string
  email: string
  stream: MediaStream
  nickname: string
}

function RemoteVideo({ stream, label }: { stream: MediaStream; label: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      aria-label={`${label} video`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: '#080808',
      }}
    />
  )
}

const VideoCallWindow = () => {
  const { setSnack } = useContext(SnackbarContext)
  const { data: session } = useSession()
  const [pic, setPic] = useState('')
  const {
    isCalling,
    setIsCalling,
    beingCalled,
    setBeingCalled,
    minimizeCall,
    setMinimizeCall,
    setSnackText,
    toChat,
    setToChat,
    fromChat,
    setFromChat,
  } = useContext(VideoCallContext)
  const [callAccepted, setCallAccepted] = useState(false)

  const isCallingRef = useRef<any>(false)
  const callStatusRef = useRef<any | undefined>(undefined)
  const callIdRef = useRef<any | undefined>(undefined)

  const socketRef = useRef<Socket | null>(null)
  const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({})
  const localStreamRef = useRef<MediaStream | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [users, setUsers] = useState<WebRTCUser[]>([])
  const [callAudio, setCallAudio] = useState<{
    outgoing: HTMLAudioElement | null
    incoming: HTMLAudioElement | null
    connected: HTMLAudioElement | null
    ended: HTMLAudioElement | null
  }>({ outgoing: null, incoming: null, connected: null, ended: null })

  const callendInit = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    Object.values(pcsRef.current).forEach((connection) => connection.close())
    pcsRef.current = {}
    localStreamRef.current = null
    setLocalStream(null)
    setCameraEnabled(true)
    callAudio.outgoing?.pause()
    callAudio.incoming?.pause()
    callAudio.ended?.play()
    setIsCalling(false)
    setMinimizeCall(false)
    isCallingRef.current = false
    setCallAccepted(false)
    setBeingCalled(false)
    setSnackText('')
    callIdRef.current = undefined
    callStatusRef.current = undefined
    setFromChat('')
    setToChat('')
    setUsers([])
  }, [
    callAudio,
    setBeingCalled,
    setFromChat,
    setIsCalling,
    setMinimizeCall,
    setSnackText,
    setToChat,
  ])

  const fetchData = useCallback(async () => {
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
  }, [fromChat, toChat])

  const acquireLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      setCameraEnabled(true)
      return stream
    } catch (cameraError) {
      console.warn('Camera access unavailable; trying an audio-only call.', cameraError)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      setCameraEnabled(false)
      setSnack(
        new Snack({
          message: 'Camera unavailable. Continuing with audio only.',
          color: 'warning',
          open: true,
        })
      )
      return stream
    }
  }, [setSnack])

  const getLocalStream = useCallback(
    async (recipient: string) => {
      try {
        const stream = await acquireLocalStream()
        localStreamRef.current = stream
        setLocalStream(stream)
        callAudio.outgoing?.play()
        if (callAudio.outgoing) callAudio.outgoing.loop = true
        setIsCalling(true)
        isCallingRef.current = true

        const response = await fetch('/api/message/newCall', {
          method: 'POST',
          body: JSON.stringify({ to: recipient }),
          headers: { 'Content-Type': 'application/json' },
        })
        const responseData = await response.json()
        if (!response.ok) {
          throw new Error(responseData.message ?? 'Could not start the call.')
        }
        callIdRef.current = responseData.newCallInfo.insertedId
        socketRef.current?.emit('callUser', {
          from: session?.user?.email,
          to: recipient,
        })
        socketRef.current?.emit('join_room', {
          room: session?.user?.email,
          email: session?.user?.email,
          nickname: session?.user?.name,
        })
      } catch (error) {
        console.error('Could not access call media or start the call:', error)
        setSnack(
          new Snack({
            message:
              error instanceof Error && error.name === 'NotAllowedError'
                ? 'Allow microphone and camera access to start a call.'
                : 'Could not access a microphone. Check your device and permissions.',
            color: 'error',
            open: true,
          })
        )
        callendInit()
      }
    },
    [
      acquireLocalStream,
      callendInit,
      callAudio,
      session,
      setIsCalling,
      setSnack,
    ]
  )

  const acceptCall = useCallback(
    async (caller: string) => {
      try {
        const stream = await acquireLocalStream()
        localStreamRef.current = stream
        setLocalStream(stream)
        setCallAccepted(true)
        callAudio.incoming?.pause()
        callAudio.connected?.play()
        socketRef.current?.emit('acceptCall', {
          to: caller,
          from: session?.user?.email,
        })
        socketRef.current?.emit('join_room', {
          room: caller,
          email: session?.user?.email,
          nickname: session?.user?.name,
        })
      } catch (error) {
        console.error('Could not access call media:', error)
        setSnack(
          new Snack({
            message:
              error instanceof Error && error.name === 'NotAllowedError'
                ? 'Allow microphone and camera access to answer the call.'
                : 'Could not access a microphone. Check your device and permissions.',
            color: 'error',
            open: true,
          })
        )
        callendInit()
      }
    },
    [
      acquireLocalStream,
      callAudio,
      callendInit,
      session,
      setSnack,
    ]
  )
  useEffect(() => {
    if (isCalling && fromChat !== '' && toChat !== '') {
      void fetchData()
      void getLocalStream(toChat)
    }
  }, [fetchData, fromChat, getLocalStream, isCalling, toChat])
  const createPeerConnection = useCallback(
    (socketID: string, email: string, nickname: string) => {
      try {
        const pc = new RTCPeerConnection({ iceServers: getIceServers() })
        pc.onicecandidate = (e) => {
          if (!(socketRef.current && e.candidate)) return
          socketRef.current.emit('candidate', {
            candidate: e.candidate,
            candidateSendID: socketRef.current.id,
            candidateReceiveID: socketID,
          })
        }
        pc.oniceconnectionstatechange = (e) => {
          console.log(e)
        }
        pc.ontrack = (e) => {
          setUsers((oldUsers) =>
            oldUsers
              .filter((user) => user.id !== socketID)
              .concat({
                id: socketID,
                email,
                nickname,
                stream: e.streams[0],
              })
          )
        }
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            if (!localStreamRef.current) return
            pc.addTrack(track, localStreamRef.current)
          })
        } else {
          console.log('no local stream')
        }
        return pc
      } catch (e) {
        console.error(e)
        return undefined
      }
    },
    []
  )
  useEffect(() => {
    setCallAudio({
      outgoing: new Audio(beaks[0]),
      incoming: new Audio(beaks[1]),
      connected: new Audio(beaks[2]),
      ended: new Audio(beaks[3]),
    })
    socketRef.current = io(
      `${String(process.env.NEXT_PUBLIC_CHAT_URI)}/chatCall`,
      {
        secure: true,
      }
    )
    return () => {
      socketRef.current?.disconnect()
    }
  }, [])
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.on(
      'all_users',
      (allUsers: Array<{ id: string; email: string; nickname: string }>) => {
        allUsers.forEach(async (user) => {
          if (!localStreamRef.current) return
          const pc = createPeerConnection(user.id, user.email, user.nickname)
          if (!(pc && socketRef.current)) return
          pcsRef.current = { ...pcsRef.current, [user.id]: pc }
          try {
            const localSdp = await pc.createOffer()
            await pc.setLocalDescription(new RTCSessionDescription(localSdp))
            socketRef.current.emit('offer', {
              sdp: localSdp,
              offerSendID: socketRef.current.id,
              offerSendEmail: session?.user?.email,
              offerReceiveID: user.id,
              offerSendNickName: session?.user?.name,
            })
          } catch (e) {
            console.error(e)
          }
        })
      }
    )
    socket.on(
      'getOffer',
      async (data: {
        sdp: RTCSessionDescription
        offerSendID: string
        offerSendEmail: string
        offerSendNickName: string
      }) => {
        const { sdp, offerSendID, offerSendEmail, offerSendNickName } = data
        if (!localStreamRef.current) return
        const pc = createPeerConnection(
          offerSendID,
          offerSendEmail,
          offerSendNickName
        )
        if (!(pc && socketRef.current)) return
        pcsRef.current = { ...pcsRef.current, [offerSendID]: pc }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          const localSdp = await pc.createAnswer()
          await pc.setLocalDescription(new RTCSessionDescription(localSdp))
          socketRef.current.emit('answer', {
            sdp: localSdp,
            answerSendID: socketRef.current.id,
            answerReceiveID: offerSendID,
          })
        } catch (e) {
          console.error(e)
        }
      }
    )
    socket.on(
      'getAnswer',
      (data: { sdp: RTCSessionDescription; answerSendID: string }) => {
        const { sdp, answerSendID } = data
        console.log('get answer')
        const pc: RTCPeerConnection = pcsRef.current[answerSendID]
        if (!pc) return
        pc.setRemoteDescription(new RTCSessionDescription(sdp))
      }
    )
    socket.on('callingMe', (data: any) => {
      if (data.to === session?.user?.email) {
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
        callAudio.incoming?.play()
        if (callAudio.incoming) callAudio.incoming.loop = true
      }
    })
    socket.on('acceptCall', (data: any) => {
      if (data.to === session?.user?.email) {
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
            message: `${data.from} accepted your call`,
            color: 'success',
            open: true,
          })
        )
        callAudio.outgoing?.pause()
        callAudio.connected?.play()
      }
    })
    socket.on(
      'getCandidate',
      async (data: {
        candidate: RTCIceCandidateInit
        candidateSendID: string
      }) => {
        const pc: RTCPeerConnection = pcsRef.current[data.candidateSendID]
        if (!pc) return
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    )
    socket.on('user_exit', (data: { id: string }) => {
      if (pcsRef.current[data.id]) {
        pcsRef.current[data.id].close()
        delete pcsRef.current[data.id]
      }
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== data.id)
      )
      callendInit()
    })

    socket.on('cancelCall', (data: any) => {
      if (data.to === session?.user?.email) {
        callendInit()
      }
    })
    return () => {
      socket.removeAllListeners()
    }
  }, [
    acceptCall,
    callAudio,
    callendInit,
    createPeerConnection,
    fetchData,
    getLocalStream,
    session?.user?.email,
    session?.user?.name,
    setBeingCalled,
    setFromChat,
    setSnack,
    setToChat,
  ])

  const handleCloseVideoCall = () => {
    if (callStatusRef.current == 'callee' && !callAccepted) {
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
    if (callAccepted) {
      socketRef.current?.emit('endCall', {})
    } else {
      socketRef.current?.emit('cancelCall', {
        from: session?.user?.email,
        to: toChat,
      })
    }
    callendInit()
  }

  const onCallEnd = () => {
    handleCloseVideoCall()
  }
  const answerCall = () => {
    acceptCall(toChat)
  }
  const toggleCamera = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks() ?? []
    if (!videoTracks.length) {
      setSnack(
        new Snack({
          message: 'No camera is available for this call.',
          color: 'warning',
          open: true,
        })
      )
      return
    }

    const nextEnabled = !cameraEnabled
    videoTracks.forEach((track) => {
      track.enabled = nextEnabled
    })
    setCameraEnabled(nextEnabled)
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
              width: 'min(900px, calc(100vw - 32px))',
              height: 'min(680px, calc(100vh - 32px))',
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
                position: 'relative',
                flexGrow: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              {callAccepted && users.length ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'grid',
                    gridTemplateColumns:
                      users.length > 1 ? 'repeat(2, minmax(0, 1fr))' : '1fr',
                    gap: '8px',
                  }}>
                  {users.map((user) => (
                    <RemoteVideo
                      key={user.id}
                      stream={user.stream}
                      label={user.nickname || user.email}
                    />
                  ))}
                </div>
              ) : (
                <Image
                  style={{
                    alignSelf: 'center',
                    border: '1px solid #6e6a91',
                    borderRadius: '50%',
                    width: 'min(240px, 45vw)',
                    height: 'auto',
                    padding: '4px',
                  }}
                  src={
                    pic == '' || pic == undefined
                      ? `/images/male.png`
                      : `/api/view?name=chats/${pic}`
                  }
                  alt="male"
                  width={240}
                  height={240}
                />
              )}
              {callAccepted && localStream && (
                <video
                  ref={(element) => {
                    if (element) element.srcObject = localStream
                  }}
                  autoPlay
                  muted
                  playsInline
                  aria-label="Your video preview"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    bottom: '12px',
                    width: 'min(28%, 220px)',
                    aspectRatio: '16 / 9',
                    objectFit: 'cover',
                    transform: 'scaleX(-1)',
                    backgroundColor: '#080808',
                    border: '1px solid #6e6a91',
                    borderRadius: '6px',
                  }}
                />
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                justifyContent: 'Center',
              }}>
              {callAccepted && localStream?.getVideoTracks().length ? (
                <Button
                  color="inherit"
                  startIcon={cameraEnabled ? <VideocamOff /> : <Videocam />}
                  onClick={toggleCamera}
                  aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}>
                  {cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
                </Button>
              ) : null}
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
        </div>
      )}
    </>
  )
}

export default VideoCallWindow
