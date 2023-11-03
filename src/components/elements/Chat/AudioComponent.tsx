import React, { useEffect, useRef, useState } from 'react'

const AudioComponent = ({ stream }) => {
    const ref = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream
    }, [stream])

    return (
        <audio
            hidden
            ref={ref}
            autoPlay
        />
    )
}

export default AudioComponent
