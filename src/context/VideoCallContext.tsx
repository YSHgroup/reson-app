import React, { createContext, useState } from 'react'

interface VideoContextProps {
  isCalling: boolean
  setIsCalling: (value: boolean) => void
  beingCalled: boolean
  setBeingCalled: (value: boolean) => void
  minimizeCall: boolean
  setMinimizeCall: (value: boolean) => void
  snackText: string | ''
  setSnackText: (value: string | '') => void
  toChat: string
  fromChat: string
  setToChat: (value: string | undefined) => void
  setFromChat: (value: string | undefined) => void
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
  snackText: '',
  setSnackText: function (value: string): void {
    throw new Error('Function not implemented.')
  },
  toChat: '',
  fromChat: '',
  setToChat: function (value: string | undefined): void {
    throw new Error('Function not implemented.')
  },
  setFromChat: function (value: string | undefined): void {
    throw new Error('Function not implemented.')
  },
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
  const [openSnack, setOpenSnack] = useState(false)
  const [snackText, setSnackText] = useState<string | ''>('')
  const [toChat, setToChat] = useState<string>()
  const [fromChat, setFromChat] = useState<string>('')
  return (
    <VideoCallContext.Provider
      value={{
        toChat,
        setToChat,
        fromChat,
        setFromChat,
        isCalling,
        setIsCalling,
        beingCalled,
        setBeingCalled,
        minimizeCall,
        setMinimizeCall,
        snackText,
        setSnackText,
      }}>
      {children}
    </VideoCallContext.Provider>
  )
}
