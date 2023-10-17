import React, { createContext, useState, useRef } from 'react'

interface VideoContextProps {
  isCalling: boolean
  setIsCalling: (value: boolean) => void
  beingCalled: boolean
  setBeingCalled: (value: boolean) => void
  minimizeCall: boolean
  setMinimizeCall: (value: boolean) => void
  localStream: MediaStream | undefined
  setLocalStream: (value: MediaStream | undefined) => void
  remoteStream: MediaStream | undefined
  setRemoteStream: (value: MediaStream | undefined) => void
  socketId: string | null
  setSocketId: (value: string | null) => void
  openSnack: boolean
  setOpenSnack: (value: boolean) => void
  callAccepted: boolean
  setCallAccepted: (value: boolean) => void
  callerSignal: string | null
  setCallerSignal: (value: string | null) => void
  snackText: string | ''
  setSnackText: (value: string | '') => void
  myAudio: any | null
  connectionPeer: any | undefined
  isCallingRef: any
  localStreamRef: any | undefined
  remoteStreamRef: any | undefined
  callStatusRef: any | undefined
  callIdRef: any | undefined,
  audio1: any | null,
  audio2: any | null,
  audio3: any | null,
  audio4: any | null,
}

export const VideoCallContext = createContext<VideoContextProps>({
  isCalling: false,
  setIsCalling: function (value: boolean): void {
    throw new Error('Function not implemented.')
  },
  beingCalled: false,
  setBeingCalled: function (value: boolean): void {
    throw new Error('Function not implemented.')
  },
  minimizeCall: false,
  setMinimizeCall: function (value: boolean): void {
    throw new Error('Function not implemented.')
  },
  localStream: undefined,
  setLocalStream: function (value: MediaStream | undefined): void {
    throw new Error('Function not implemented.')
  },
  remoteStream: undefined,
  setRemoteStream: function (value: MediaStream | undefined): void {
    throw new Error('Function not implemented.')
  },
  socketId: null,
  setSocketId: function (value: string | null): void {
    throw new Error('Function not implemented.')
  },
  openSnack: false,
  setOpenSnack: function (value: boolean): void {
    throw new Error('Function not implemented.')
  },
  callAccepted: false,
  setCallAccepted: function (value: boolean): void {
    throw new Error('Function not implemented.')
  },
  callerSignal: null,
  setCallerSignal: function (value: string | null): void {
    throw new Error('Function not implemented.')
  },
  snackText: '',
  setSnackText: function (value: string): void {
    throw new Error('Function not implemented.')
  },
  myAudio: undefined,
  connectionPeer: undefined,
  isCallingRef: undefined,
  localStreamRef: undefined,
  remoteStreamRef: undefined,
  callStatusRef: undefined,
  callIdRef: undefined,
  audio1: null,
  audio2: null,
  audio3: null,
  audio4: null
})

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isCalling, setIsCalling] = useState<boolean>(false)
  const [beingCalled, setBeingCalled] = useState<boolean>(false)
  const [minimizeCall, setMinimizeCall] = useState<boolean>(false)
  const [localStream, setLocalStream] = useState<MediaStream | undefined>(
    undefined
  )
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(
    undefined
  )
  const [socketId, setSocketId] = useState<string | null>(null)
  const [openSnack, setOpenSnack] = useState(false)
  const [callAccepted, setCallAccepted] = useState(false)
  const [callerSignal, setCallerSignal] = useState<string | null>(null)
  const [snackText, setSnackText] = useState<string | ''>('')
  const myAudio = useRef<any>(null)

  const connectionPeer = useRef<any>(undefined)
  const isCallingRef = useRef<any>(false)
  const localStreamRef = useRef<any | undefined>(undefined)
  const remoteStreamRef = useRef<any | undefined>(undefined)
  const callStatusRef = useRef<any | undefined>(undefined)
  const callIdRef = useRef<any | undefined>(undefined)
  const audio1 = useRef<any>(null)
  const audio2 = useRef<any>(null)
  const audio3 = useRef<any>(null)
  const audio4 = useRef<any>(null)



  return (
    <VideoCallContext.Provider
      value={{
        connectionPeer,
        isCallingRef,
        localStreamRef,
        remoteStreamRef,
        callStatusRef,
        callIdRef,
        isCalling,
        setIsCalling,
        beingCalled,
        setBeingCalled,
        minimizeCall,
        setMinimizeCall,
        localStream,
        setLocalStream,
        remoteStream,
        setRemoteStream,
        socketId,
        setSocketId,
        openSnack,
        setOpenSnack,
        callAccepted,
        setCallAccepted,
        callerSignal,
        setCallerSignal,
        snackText,
        setSnackText,
        myAudio,
        audio1,
        audio2,
        audio3,
        audio4,
      }}>
      {children}
    </VideoCallContext.Provider>
  )
}
