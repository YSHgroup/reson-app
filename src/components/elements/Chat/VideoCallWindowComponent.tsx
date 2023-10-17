import React, { useState, useEffect, useRef, useContext } from 'react'
import { Minimize, CallEnd, PhoneEnabled } from '@mui/icons-material'
import Fab from '@mui/material/Fab'
import {
  Close,
} from '@mui/icons-material'
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress'
import {
  Stack,
} from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import { useWindowSize } from '@react-hook/window-size'
import createCache from '@emotion/cache'
import IsCallingContext from 'context/IsCallingContext'
import { VideoCallContext } from 'context/VideoCallContext'

const cache = createCache({
  key: 'css',
  prepend: true,
})

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

let socket: any

let peer: any

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

const VideoCallWindow = () => {
  const router = useRouter()
  const { email } = router.query
  const { data: session } = useSession()
  const [pic, setPic] = useState('')
  const [inputValue, setInputValue] = useState<string>('')
  const [messages, setMessages] = useState<Array<any>>([])
  // const [playBeak, setPlayBeak] = useState<Boolean>(false);
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [selectedContent, setSelectedContent] = useState({
    content: '',
    type: '',
  })

  const {
    isCalling,
    setIsCalling,
    beingCalled,
    setBeingCalled,
    minimizeCall,
    setMinimizeCall,
    remoteStream,
    setRemoteStream,
    localStream,
    setLocalStream,
    socketId,
    setSocketId,    
    openSnack,
    setOpenSnack,
    callAccepted,
    setCallAccepted,
    callerSignal,
    setCallerSignal,
    setSnackText,
    snackText,
    myAudio,
    connectionPeer,
    isCallingRef,
    localStreamRef,
    remoteStreamRef,
    callStatusRef,
    callIdRef,
    audio1,
    audio2,
    audio3,
    audio4
  } = useContext(VideoCallContext)

  const [, windowHeight] = useWindowSize()
  // voice message : false, general message: true
  const [messageType, setMessageType] = useState(true)
  // recoding time max: 5min
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploadBlob, setIsUploadBlob] = useState(false)
  //
  const recordedChunks = useRef<Blob[]>([])
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const [disabledButton, setDisabledButton] = useState<boolean>(false)
  // let mediaRecorder: MediaRecorder;

  const [dropdownFlag, setDropDownFlag] = useState<boolean>(true)
  // const localVideoRef = useRef<HTMLVideoElement>(null);
  // const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // useEffect(() => {
  //     if (localStream && localVideoRef.current) {
  //         localVideoRef.current.srcObject = localStream;
  //     }
  // }, [localStream]);

  // useEffect(() => {
  //     if (remoteStream && remoteVideoRef.current) {
  //         remoteVideoRef.current.srcObject = remoteStream;
  //     }
  // }, [remoteStream]);
  const IsCallingContextValiable = useContext(IsCallingContext)
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
  useEffect(() => {
    getMsgs()
    audio1.current = new Audio(beaks[0])
    audio2.current = new Audio(beaks[1])
    audio3.current = new Audio(beaks[2])
    audio4.current = new Audio(beaks[3])
    socket = io(String(process.env.NEXT_PUBLIC_CHAT_URI), { secure: true })
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
        callStatusRef.current = 'callee'
        setBeingCalled(true)
        setSnackText(`${data.from} is calling you.`)
        setOpenSnack(true)
        setCallerSignal(data.signal)
        audio2.current.play()
        audio2.current.loop = true
      }
    })
    // return () => socket.disconnect();

    // Close the dropdown if the user clicks outside of it
    window.onclick = function (event: Event) {
      // setDropDownFlag(true);
      const target = event.target as HTMLElement
      if (!target?.matches('.dropBtn')) {
        let dropdowns = document.getElementsByClassName('reactionEmodicons')
        let dropdownsMore = document.getElementsByClassName(
          'reactionEmodiconsMore'
        )
        let i: number
        for (i = 0; i < dropdowns.length; i++) {
          let openDropdown = dropdowns[i]
          if (openDropdown.classList.contains('showDropdownContent')) {
            openDropdown.classList.remove('showDropdownContent')
            dropdownsMore[i].classList.remove('showDropdownContent')
          }
        }
      }
    }
  }, [])

  useEffect(() => {
    // socket.on('messages', (msgs: any) => {
    //     setMessages(msgs);
    // });

    socket.on('newMessage', (msg: any) => {
      if (msg.author == email || msg.author == session?.user?.email)
        setMessages((prevState) => [...prevState, msg])
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
          .then((data) => {
            // setCallId(data.newCallInfo.insertedId);
          })
      }
      handleCloseVideoCall(false)
    })

    // navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
    //     setLocalStream(stream);
    // }).catch((error) => {
    //     console.error("Error accessing media devices....", error)
    //     alert(error)
    // });
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      const responseData = { email: email }
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
    fetchData()
  }, [])

  const acceptCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: false, audio: true })
      .then((stream: any) => {
        setLocalStream(stream)
        localStreamRef.current = stream
        setCallAccepted(true)
        audio2.current.pause()
        audio3.current.play()
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
        connectionPeer.current = peer
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
    localStreamRef.current?.getTracks().forEach((track: { stop: () => any }) => track.stop())
    remoteStreamRef.current?.getTracks().forEach((track: { stop: () => any }) => track.stop())
    audio1.current.pause()
    audio2.current.pause()
    audio4.current.play()
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

  const onCallEnd = () => {
    handleCloseVideoCall()
  }
  const answerCall = () => {
    acceptCall()
  }

  return (
    <>
    {(isCalling || beingCalled) && !minimizeCall && 
    (<div
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
      {/* <video
                ref={localVideoRef}
                muted
                autoPlay
                playsInline
                style={{
                    width: '180px',
                    height: '135px',
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '2px solid white',
                }}>
            </video> */}
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
        <Minimize onClick={() => setMinimizeCall(true)} sx={{ fontSize: '32px' }} />
        <Close onClick={onCallEnd} sx={{ fontSize: '32px' }} />
      </Stack>
    </div>)
    }
    </>
  )
}

export default VideoCallWindow
