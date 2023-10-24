import React, { useEffect, useRef, useState } from 'react'

interface Props {
  email: string
  stream: MediaStream
  muted?: boolean
  nickname: string
}

const Video = ({ nickname, email, stream, muted }: Props) => {
  const ref = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState<boolean>(false)

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream
    if (muted) setIsMuted(muted)
  }, [stream, muted])

  return (
    <div
      style={{
      }}>
      <video
        ref={ref}
        autoPlay
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black',
        }}
      />
      <div
        style={{
          textAlign: 'center',
        }}>
        {nickname}
      </div>
    </div>
  )
}

export default Video
