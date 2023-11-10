import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { Minimize, CallEnd, PhoneEnabled } from '@mui/icons-material'
import Fab from '@mui/material/Fab'
import { Close } from '@mui/icons-material'
import LinearProgress, {
} from '@mui/material/LinearProgress'
import { Stack } from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import io from 'socket.io-client'
import { VideoCallContext } from 'context/VideoCallContext'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import AudioComponent from './AudioComponent'

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const pc_config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
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
const VideoCallWindow = () => {
  const router = useRouter()
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
  const [callAccepted, setCallAccepted] = useState(false)

  const isCallingRef = useRef<any>(false)
  const callStatusRef = useRef<any | undefined>(undefined)
  const callIdRef = useRef<any | undefined>(undefined)

  const socketRef = useRef<SocketIOClient.Socket>()
  const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({})
  const localVideoRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream>()
  const [users, setUsers] = useState<WebRTCUser[]>([])

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

  useEffect(() => {
    if (isCalling && fromChat !== '' && toChat !== '') {
      fetchData()
      getLocalStream(toChat)
    }
  }, [isCalling, fromChat, toChat])

  const getLocalStream = useCallback(async (toChat: string) => {
    socketRef.current.emit('callUser', {
      from: session?.user?.email,
      to: toChat
    })
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    }).then((localStream) => {
      localStreamRef.current = localStream
      audio1.current.play()
      audio1.current.loop = true
      setIsCalling(true)
      isCallingRef.current = true
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream
      console.log(socketRef.current, "socket.current")
      if (!socketRef.current) return
      const payload = {
        to: toChat,
      }
      fetch('/api/message/newCall', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(async (res: any) => {
        const resData = await res.json()
        callIdRef.current = resData.newCallInfo.insertedId
      })
      socketRef.current.emit('join_room', {
        room: session?.user?.email,
        email: session?.user?.email,
        nickname: session?.user?.name,
      })
    }).catch((error) => {
      setSnack(
        new Snack({
          message: "Not found media device",
          color: 'error',
          open: true,
        })
      )
      audio1.current.pause()
      audio2.current.pause()
      audio4.current.play()
      setIsCalling(false)
      setMinimizeCall(false)
      setBeingCalled(false)
      setSnackText('')
      setFromChat('')
      setToChat('')
    })
  }, [])

  const acceptCall = useCallback(async (toChat: string) => {
    socketRef.current.emit('acceptCall', {
      to: toChat,
      from: session?.user?.email,
    })
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })
      localStreamRef.current = localStream
      setCallAccepted(true)
      audio2.current.pause()
      audio3.current.play()
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream
      if (!socketRef.current) return
      socketRef.current.emit('join_room', {
        room: toChat,
        email: session?.user?.email,
        nickname: session?.user?.name,
      })
    } catch (e) {
      setSnack(
        new Snack({
          message: "Not found media device",
          color: 'error',
          open: true,
        })
      )
      audio1.current.pause()
      audio2.current.pause()
      audio4.current.play()
      setIsCalling(false)
      setMinimizeCall(false)
      setBeingCalled(false)
      setSnackText('')
      setFromChat('')
      setToChat('')
    }
  }, [])
  const createPeerConnection = useCallback(
    (socketID: string, email: string, nickname: string) => {
      try {
        const pc = new RTCPeerConnection(pc_config)
        pc.onicecandidate = (e) => {
          if (!(socketRef.current && e.candidate)) return
          console.log('onicecandidate')
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
          console.log('localstream add')
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
    audio1.current = new Audio(beaks[0])
    audio2.current = new Audio(beaks[1])
    audio3.current = new Audio(beaks[2])
    audio4.current = new Audio(beaks[3])
    socketRef.current = io(
      `${String(process.env.NEXT_PUBLIC_CHAT_URI)}/chatCall`,
      {
        secure: true,
      }
    )
  }, [])
  useEffect(() => {
    socketRef.current.on(
      'all_users',
      (allUsers: Array<{ id: string; email: string; nickname: string }>) => {
        allUsers.forEach(async (user) => {
          if (!localStreamRef.current) return
          const pc = createPeerConnection(user.id, user.email, user.nickname)
          if (!(pc && socketRef.current)) return
          pcsRef.current = { ...pcsRef.current, [user.id]: pc }
          try {
            const localSdp = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: false,
            })
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
    socketRef.current.on(
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
          const localSdp = await pc.createAnswer({
            offerToReceiveVideo: false,
            offerToReceiveAudio: true,
          })
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
    socketRef.current.on(
      'getAnswer',
      (data: { sdp: RTCSessionDescription; answerSendID: string }) => {
        const { sdp, answerSendID } = data
        console.log('get answer')
        const pc: RTCPeerConnection = pcsRef.current[answerSendID]
        if (!pc) return
        pc.setRemoteDescription(new RTCSessionDescription(sdp))
      }
    )
    socketRef.current.on('callingMe', (data: any) => {
      console.log(data.to, "calling Me")
      console.log(session?.user?.email, "session")
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
        audio2.current.play()
        audio2.current.loop = true
      }
    })
    socketRef.current.on('acceptCall', (data: any) => {
      console.log(data.to, "acceptCall")
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
        audio1.current.pause()
        audio3.current.play()
      }

    })
    socketRef.current.on(
      'getCandidate',
      async (data: {
        candidate: RTCIceCandidateInit
        candidateSendID: string
      }) => {
        console.log('get candidate')
        const pc: RTCPeerConnection = pcsRef.current[data.candidateSendID]
        if (!pc) return
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        console.log('candidate add success')
      }
    )
    socketRef.current.on('user_exit', (data: { id: string }) => {
      callendInit()
    })

    socketRef.current.on('cancelCall', (data: any) => {
      if (data.to === session?.user?.email) {
        callendInit()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPeerConnection, getLocalStream, acceptCall])

  const handleCloseVideoCall = (flag: Boolean = true) => {
    console.log(toChat, "toChat===========")
    if (callStatusRef.current == "callee") {
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
      socketRef.current.emit('endCall', {})
    } else {
      socketRef.current.emit('cancelCall', {
        from: session?.user?.email,
        to: toChat
      })
      callendInit()
    }
  }

  const callendInit = () => {
    localVideoRef.current = null
    localStreamRef.current
      ?.getTracks()
      .forEach((track: { stop: () => any }) => track.stop())
    pcsRef.current = {}
    audio1.current.pause()
    audio2.current.pause()
    audio4.current.play()
    setIsCalling(false)
    setMinimizeCall(false)
    isCallingRef.current = false
    setCallAccepted(false)
    setBeingCalled(false)
    setSnackText('')
    callIdRef.current = undefined
    setFromChat('')
    setToChat('')
    delete pcsRef.current
    setUsers([])
  }

  const onCallEnd = () => {
    handleCloseVideoCall()
  }
  const answerCall = () => {
    console.log(toChat)
    acceptCall(toChat)
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
        </div>
      )}
      {callAccepted ? (
        users.map((user, index) =>
          (<AudioComponent key={user.email} stream={user.stream} />)
        )
      ) : null}
    </>
  )
}

export default VideoCallWindow
