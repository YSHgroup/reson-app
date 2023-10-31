import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'
import {
  Minimize,
  CallEnd,
  VolumeOff,
  VolumeUp,
  Videocam,
  VideocamOff,
} from '@mui/icons-material'
import Fab from '@mui/material/Fab'
import { io } from 'socket.io-client'
import Video from './Video'
import { getSession, useSession } from 'next-auth/react'
import SnackbarContext, { Snack } from 'context/SnackbarContext'

type WebRTCUser = {
  id: string
  email: string
  stream: MediaStream
  nickname: string
}

const pc_config = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

interface VideoCallRoomProps {
  handleClose: (value: boolean) => void
  group: any
}
const SOCKET_SERVER_URL = `${String(
  process.env.NEXT_PUBLIC_CHAT_URI
)}/groupCall`
const VideoCallRoom = ({ handleClose, group }: VideoCallRoomProps) => {
  const socketRef = useRef<any>()
  const pcsRef = useRef<{ [socketId: string]: RTCPeerConnection }>({})
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream>()
  const [users, setUsers] = useState<WebRTCUser[]>([])
  const { data: session } = useSession()
  const [isAudio, setIsAudio] = useState<boolean>(true)
  const [isVideo, setIsVideo] = useState<boolean>(true)
  const { setSnack } = useContext(SnackbarContext)

  const getLocalStream = useCallback(async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 240,
          height: 240,
        },
      })
      localStreamRef.current = localStream
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream
      if (!socketRef.current) return
      socketRef.current.emit('join_room', {
        room: group._id,
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

  const handleSetIsMuted = (value: boolean) => {
    setIsAudio(value)
    localStreamRef.current
      .getAudioTracks()
      .forEach((track) => (track.enabled = !isAudio))
  }

  const handleSeIsVideo = (value: boolean) => {
    setIsVideo(value)
    localStreamRef.current
      .getVideoTracks()
      .forEach((track) => (track.enabled = !isVideo))
  }

  const handleCallEnd = () => {
    socketRef.current.disconnect()
    localVideoRef.current = null
    localStreamRef.current
      ?.getTracks()
      .forEach((track: { stop: () => any }) => track.stop())
    pcsRef.current = {}
    handleClose(false)
  }

  useEffect(() => {
    socketRef.current = io(
      `${String(process.env.NEXT_PUBLIC_CHAT_URI)}/groupCall`,
      {
        secure: true,
      }
    )
    getLocalStream()

    socketRef.current.on(
      'all_users',
      (allUsers: Array<{ id: string; email: string; nickname: string }>) => {
        console.log(allUsers, 'allUsers')
        allUsers.forEach(async (user) => {
          if (!localStreamRef.current) return
          const pc = createPeerConnection(user.id, user.email, user.nickname)
          if (!(pc && socketRef.current)) return
          pcsRef.current = { ...pcsRef.current, [user.id]: pc }
          try {
            const localSdp = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            })
            console.log('create offer success')
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
        console.log('get offer')
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
            offerToReceiveVideo: true,
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
      if (!pcsRef.current[data.id]) return
      pcsRef.current[data.id].close()
      delete pcsRef.current[data.id]
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== data.id))
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      users.forEach((user) => {
        if (!pcsRef.current[user.id]) return
        pcsRef.current[user.id].close()
        delete pcsRef.current[user.id]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createPeerConnection, getLocalStream])
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 1000,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <div
        style={{
          width: '765px',
          height: '500px',
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
            flexWrap: 'wrap',
            overflowY: 'auto',
          }}>
          <div style={{}}>
            <video
              style={{
                width: 240,
                height: 240,
                margin: 5,
                backgroundColor: 'black',
              }}
              muted
              ref={localVideoRef}
              autoPlay
            />
            <div style={{ textAlign: 'center' }}>Me</div>
          </div>
          {users.map((user, index) => (
            <Video
              key={user.email}
              email={user.email}
              nickname={user.nickname}
              stream={user.stream}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'Center',
          }}>
          {!isVideo ? (
            <Fab
              style={{
                backgroundColor: '#29b6f6',
                marginRight: '10px',
              }}
              onClick={(e) => handleSeIsVideo(true)}
              aria-label="add">
              <Videocam sx={{ color: 'white', fontSize: '24px' }} />
            </Fab>
          ) : (
            <Fab
              style={{
                backgroundColor: '#af0000',
                marginRight: '10px',
              }}
              onClick={(e) => handleSeIsVideo(false)}
              aria-label="add">
              <VideocamOff sx={{ color: 'white', fontSize: '24px' }} />
            </Fab>
          )}

          {!isAudio ? (
            <Fab
              style={{
                backgroundColor: '#29b6f6',
                marginRight: '10px',
              }}
              onClick={(e) => handleSetIsMuted(true)}
              aria-label="add">
              <VolumeUp sx={{ color: 'white', fontSize: '24px' }} />
            </Fab>
          ) : (
            <Fab
              style={{
                backgroundColor: '#af0000',
                marginRight: '10px',
              }}
              onClick={(e) => handleSetIsMuted(false)}
              aria-label="add">
              <VolumeOff sx={{ color: 'white', fontSize: '24px' }} />
            </Fab>
          )}

          <Fab
            style={{ backgroundColor: '#af0000' }}
            aria-label="add"
            onClick={(e) => {
              handleCallEnd()
            }}>
            <CallEnd sx={{ color: 'white', fontSize: '24px' }} />
          </Fab>
        </div>
      </div>
    </div>
  )
}
export default VideoCallRoom
