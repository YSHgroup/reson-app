import React, { Fragment, useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function ChatImage({ content, filetype, handleClick }: any) {
    const [imageDimensions, setImageDimensions] = useState<{
      width: number
      height: number
    }>({
      width: 0,
      height: 0,
    })
  
    const handleImageLoad = (
      event: React.SyntheticEvent<HTMLImageElement, Event>
    ) => {
      const img = event.currentTarget
      const tempImage = document.createElement('img') as HTMLImageElement
      tempImage.crossOrigin = 'anonymous'
  
      tempImage.onload = () => {
        setImageDimensions({
          width: tempImage.width * 10,
          height: tempImage.height * 10,
        })
        URL.revokeObjectURL(img.src) // Release memory
      }
  
      // Assign the src after the onload is attached
      tempImage.src = img.src
    }
  
    return (
      <div>
        <Image
          src={`/api/view?name=${content}`}
          alt={content}
          width={imageDimensions.width}
          height={imageDimensions.height}
          onClick={() => handleClick(content, filetype)}
          onLoad={handleImageLoad}
        />
      </div>
    )
  }
  