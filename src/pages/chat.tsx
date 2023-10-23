import React, { Fragment, useState, useEffect, useRef, useContext } from 'react'
import ReactDOM from 'react-dom'
import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  AttachFile as AttachFileIcon,
  Close,
  Mail as MailIcon,
  Send,
  Mic as MicIcon,
  CallReceived,
  CallMade,
  MoreHoriz,
} from '@mui/icons-material'
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  IconButton,
  Stack,
  TextField,
  Typography,
  Avatar,
  Grid,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { NextApiRequest } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import { formatTime, timestampToFormattedDate } from '@lib/utils'
import { useWindowSize } from '@react-hook/window-size'
import Link from 'next/link'
import cn from 'classnames'
import {
  ContentReactedEmojis,
  EmojiChildComponent,
} from '@elements/ContentReactedEmojis'
import CircularProgress from '@mui/material/CircularProgress'
import styles from '../styles/chat.module.scss'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { StyledEngineProvider } from '@mui/material/styles'
import CallButton from '@elements/Chat/CallButtonComponent'
import IsCallingContext from 'context/IsCallingContext'
import MediaViewer from '@elements/Chat/MediaViewerComponent'
import ChatImage from '@elements/Chat/ChangeImageComponent'
import { VideoCallContext } from 'context/VideoCallContext'
import PageSocket from '@constants/PageSocket'

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


const ICE_SERVERS = [
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

let callLabel = ['Canceled call', 'Declined call', 'Outgoing call']

let callLabel_ = ['Missed call', 'Declined call', 'Incoming call']

export default function Chat() {
  const router = useRouter()
  const { email } = router.query
  const { data: session } = useSession()
  const [pic, setPic] = useState('')
  const [inputValue, setInputValue] = useState<string>('')
  const [messages, setMessages] = useState<Array<any>>([])
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
    setEmail,
    openSnack,
    setOpenSnack,
    snackText,
    setSnackText,
  } = useContext(VideoCallContext)

  const [dropdownFlag, setDropDownFlag] = useState<boolean>(true)

  const [, windowHeight] = useWindowSize()

  const [localStream, setLocalStream] = useState<MediaStream | undefined>(
    undefined
  )
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(
    undefined
  )
  const [socketId, setSocketId] = useState<string | null>(null)
  const myAudio = useRef<any>(null)

  const localStreamRef = useRef<any | undefined>(undefined)
  const remoteStreamRef = useRef<any | undefined>(undefined)
  const callStatusRef = useRef<any | undefined>(undefined)
  const callIdRef = useRef<any | undefined>(undefined)

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

  const handleClick = (content: any, type: any) => {
    setSelectedContent({ content: content, type: type })
    setOpen(true)
  }

  const handleChangeInput = (e: any) => {
    setInputValue(e.target.value)
  }

  const handleSetMessageType = (value: boolean) => {
    if (value) {
      stopVoiceRecording(false)
    }
    setMessageType(value)
  }

  const handleMediaRecorderInit = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      setLocalStream(stream)
      localStreamRef.current = stream
      startVoiceRecording()
    } catch (error) {
      setSnackText(`${error}`)
      setOpenSnack(true)
    }
  }

  const startVoiceRecording = () => {
    recordedChunks.current = []

    let stream = localStreamRef.current
    setMessageType(false)
    try {
      if (stream) {
        mediaRecorder.current = new MediaRecorder(stream as MediaStream)
      }
    } catch (error) {
      setSnackText(`${error}`)
      setOpenSnack(true)
      return
    }
    mediaRecorder.current?.addEventListener('stop', (e) => {})

    mediaRecorder.current?.start()
  }

  const onDataAvailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.current.push(event.data)
    }
    const audioBlob = new Blob(recordedChunks.current, { type: 'audio/wav' })
    asyncuploadAudio(audioBlob)
  }

  const stopVoiceRecording = (status: Boolean) => {
    if (status) {
      mediaRecorder.current?.addEventListener('dataavailable', onDataAvailable)
    }
    mediaRecorder.current?.stop()
    localStream?.getTracks().forEach((track) => track.stop())
    localStreamRef.current
      ?.getTracks()
      .forEach((track: { stop: () => any }) => track.stop())
    setLocalStream(undefined)
    localStreamRef.current = undefined
    recordedChunks.current = []
    setIsUploadBlob(false)
  }
  async function asyncuploadAudio(file: any) {
    setDisabledButton(true)
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/message/voiceFileUpload', {
      method: 'POST',
      body: formData,
    })
    if (response.ok) {
      const res = await response.json()
      const message = {
        author: session?.user?.email,
        type: 'voiceMessage',
        content: res.filename,
        to: email,
        date: timestampToFormattedDate(Date.now()),
        time: formatTime(),
        read: false,
      }
      socket.emit('sendMessage', message)
      setDisabledButton(false)
      const fetchData = async () => {
        const payload = { message: message.content }
        try {
          await fetch('/api/message/message', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.log(error)
        }
      }
      fetchData()
    } else {
      setDisabledButton(false)
      console.error('Failed to upload file')
    }
  }

  //
  const LinearProgressWithLabel = (
    props: LinearProgressProps & { value: number }
  ) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => handleSetMessageType(true)}>
          <Close />
        </IconButton>
        <Box sx={{ ml: 1, width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">
            {`${Math.floor(props.value / 60)}`} :
            {`${
              Math.floor(props.value % 60) < 10
                ? `0${Math.floor(props.value % 60)}`
                : Math.floor(props.value % 60)
            }`}
          </Typography>
        </Box>
      </Box>
    )
  }
  // voice recoding progress
  useEffect(() => {
    let progressTimer
    if (messageType) {
      setRecordingTime(0)
      clearTimeout(progressTimer)
    } else {
      if (recordingTime >= 99) {
        setMessageType(true)
        setIsUploadBlob(true)
        stopVoiceRecording(true)
      } else {
        progressTimer = setTimeout(() => {
          setRecordingTime((prevProgress) =>
            prevProgress > 100 ? 1 : prevProgress + 1
          )
        }, 800)
      }
    }
  }, [messageType, recordingTime])

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

  const handleClose = () => {
    setOpen(false)
  }

  const initiateCall = () => {
    setIsCalling(true)
  }

  useEffect(() => {
    getMsgs()
    setEmail(session?.user?.email)
    socket = io(`${String(process.env.NEXT_PUBLIC_CHAT_URI)}`, { secure: true })
    socket.on('connect', () => {
      // Fetch existing messages from the server
      socket.emit('emailMapId', { email: session?.user?.email })
      // socket.emit('getMessages', { to: email, author: session?.user?.email });
    })
    socket.on('getid', (sockId: string) => {
      setSocketId(sockId)
    })
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


    socket.on(
      'newReactEmoji',
      ({ msgId, emojiId }: { msgId: string; emojiId: string }) => {
        showReactedEmoji(msgId, emojiId)
      }
    )
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

  const showReactedEmoji = (msgId: string, emojiId: string | number) => {
    const reactedMsg = document.getElementById(
      `reactedEmojis_${msgId}`
    ) as HTMLElement
    const reactedEmoji = document.getElementById(`reacted_${msgId}_${emojiId}`)
    if (reactedEmoji) {
      reactedMsg.removeChild(reactedEmoji)
    } else {
      const containerElement = document.createElement('div')
      ReactDOM.render(
        <EmojiChildComponent
          msgId={msgId}
          emojiId={`${emojiId}`}
          users={[`${session?.user?.email}`]}
        />,
        containerElement
      )
      if (containerElement?.firstChild) {
        reactedMsg?.appendChild(containerElement?.firstChild)
      }
    }
  }
  useEffect(() => {
    if (isUploadBlob) {
      let sendMessageBtn = document.getElementById('sendMessageBtn')
      sendMessageBtn?.click()
    }
  }, [isUploadBlob])

  const sendMessage = async (e: any) => {
    e.preventDefault()
    if (!messageType) {
      stopVoiceRecording(true)
    } else {
      const message = {
        author: session?.user?.email,
        type: 'text',
        content: inputValue,
        to: email,
        date: timestampToFormattedDate(Date.now()),
        time: formatTime(),
        read: false,
      }
      if (!message) return
      if (inputValue.trim() == '' && messageType) return
      socket.emit('sendMessage', message)
      const fetchData = async () => {
        const payload = { message: message.content }
        try {
          await fetch('/api/message/message', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.log(error)
        }
      }
      fetchData()
    }

    setInputValue('')
    if (!messageType) {
      setMessageType(true)
    }
  }

  const CheckDate = (message: any, messages: any, i: number) => {
    if (messages[i - 1] === undefined) {
      return message.date
    }
    if (messages[i - 1].date == !messages.date) {
      return message.date
    }
  }

  const handleClipboardPaste = async (event: {
    clipboardData: { items: any }
  }) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (!blob) return
        await asyncupload(blob)
      }
    }
  }

  async function asyncupload(file: any) {
    setDisabledButton(true)
    const data = await file.arrayBuffer()
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (event) => {
      const percentCompleted = Math.round((event.loaded * 100) / event.total)
    }

    xhr.open('POST', '/api/upload')
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.response)
        const message = {
          author: session?.user?.email,
          type: 'media',
          filetype: response.type,
          content: response.data,
          to: email,
          date: timestampToFormattedDate(Date.now()),
          time: formatTime(),
          read: false,
        }
        socket.emit('sendMessage', message)
        setDisabledButton(false)
      } else {
        console.error('Failed to upload file')
        setDisabledButton(false)
      }
    }
    xhr.send(
      JSON.stringify({
        name: file.name,
        type: 'chat',
        data: Array.from(new Uint8Array(data)),
      })
    )
  }

  const messageElement = (
    type: string,
    content:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | React.ReactFragment
      | React.ReactPortal
      | null
      | undefined,
    time:
      | string
      | number
      | boolean
      | React.ReactElement<any, string | React.JSXElementConstructor<any>>
      | React.ReactFragment
      | React.ReactPortal
      | null
      | undefined,
    filetype: string,
    mine: boolean,
    message: any
  ) => {
    return (
      <div>
        {type == 'media' ? (
          filetype == 'image' ? (
            <ChatImage
              content={content}
              filetype={filetype}
              handleClick={handleClick}
            />
          ) : (
            <video
              src={`/api/view?name=${content}`}
              width={160}
              height={90}
              onClick={() => handleClick(content, filetype)}></video>
          )
        ) : type == 'voiceCall' ? (
          mine ? (
            <>
              <Typography className={cn('msgText')} variant="body1">
                {callLabel[Number(content)]}
              </Typography>
              {content == 2 ? (
                <CallMade color={'success'} fontSize="small" />
              ) : (
                <CallMade sx={{ color: 'red' }} fontSize="small" />
              )}
            </>
          ) : (
            <>
              <Typography className={cn('msgText')} variant="body1">
                {callLabel_[Number(content)]}
              </Typography>
              {content == 0 && (
                <CallReceived sx={{ color: 'red' }} fontSize="small" />
              )}
              {content == 1 && (
                <CallReceived sx={{ color: 'red' }} fontSize="small" />
              )}
              {content == 2 && (
                <CallReceived color={'success'} fontSize="small" />
              )}
            </>
          )
        ) : type === 'voiceMessage' ? (
          <audio controls style={{ width: '280px', height: '48px' }}>
            <source
              src={'/api/view?name=voiceMessages/' + content}
              type="audio/wav"
            />
          </audio>
        ) : (
          <Typography className={cn('msgText')} variant="body1">
            {content}
          </Typography>
        )}
        <Typography sx={{ fontSize: '10px', color: '#e1e1e1' }}>
          {time}
        </Typography>
        <ContentReactedEmojis message={message} />
      </div>
    )
  }

  useEffect(() => {
    // ...socket.io setup and message handling...
    const unreadMessages = messages.filter(
      (item) => item?.to === session?.user?.email && !item?.read
    )

    if (unreadMessages.length > 0) {
      unreadMessages.map((item) => {
        socket.emit('readMessage', { ...item, read: true })
      })
    }

    // Scroll to the bottom when new messages arrive
    if (chatWindowRef.current) {
      let chatWindow = chatWindowRef.current
      chatWindow.scrollTop = chatWindow?.scrollHeight
    }
  }, [messages])

  const handleCloseSnack = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackText('')
    setOpenSnack(false)
  }

  const handleReactionDropdown = (index: number) => {
    // let reactDropdown = reactDropdownRef.current;
    // if (dropdownFlag) {
    const element = document.getElementById(`reactDropdownContent-${index}`)
    if (element) {
      let dropdowns = document.getElementsByClassName('reactionEmodicons')
      let dropdownsMore = document.getElementsByClassName(
        'reactionEmodiconsMore'
      )
      let i: number
      for (i = 0; i < dropdowns.length; i++) {
        let openDropdown = dropdowns[i]
        if (`${openDropdown.id}` === `reactDropdownContent-${index}`) continue
        if (openDropdown.classList.contains('showDropdownContent')) {
          openDropdown.classList.remove('showDropdownContent')
          dropdownsMore[i].classList.remove('showDropdownContent')
        }
      }
      element.classList.toggle('showDropdownContent')
    }
    // }
    // setDropDownFlag((prevState) => !prevState);
  }

  const reactEmoji = async (msgId: string, emojiId: number) => {
    const res = await fetch('/api/message/reactEmoji', {
      method: 'POST',
      body: JSON.stringify({
        msgId: msgId,
        emojiId: emojiId,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resData = await res.json()
    showReactedEmoji(msgId, emojiId)
    socket.emit('reactEmoji', { msgId, emojiId, to: email })
    // if (resData.message == 'success') {
    //     showReactedEmoji(msgId, emojiId);
    //     socket.emit('reactEmoji', { msgId, emojiId, to: email });
    // }
  }

  const reactEmojiMore = (index: number) => {
    const element = document.getElementById(`reactDropdownContentMore-${index}`)
    // let dropdowns = document.getElementsByClassName("reactionEmodiconsMore");
    // let i: number;
    // for (i = 0; i < dropdowns.length; i++) {
    //     let openDropdown = dropdowns[i];
    //     if (openDropdown.classList.contains('showDropdownContent')) {
    //         openDropdown.classList.remove('showDropdownContent');
    //     }
    // }
    // console.log(element)
    element?.classList.toggle('showDropdownContent')
  }

  const action = (
    <React.Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleCloseSnack}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  )

  return (
    <StyledEngineProvider injectFirst>
      <CacheProvider value={cache}>
        <IsCallingContext.Provider value={isCalling}>
          <FullLayout title="Chat" appbar={false}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  width: '100vw',
                  background: '#3339',
                  alignItems: 'center',
                  textAlign: 'center',
                }}>
                <Box
                  sx={{
                    background: 'rgb(47,255,79)',
                    borderRadius: 2,
                    width: 70,
                    height: 70,
                    // padding: 1,
                  }}>
                  <Image
                    src={
                      pic == '' || pic == undefined
                        ? `/images/male.png`
                        : `/api/view?name=chats/${pic}`
                    }
                    alt="male"
                    width={70}
                    height={70}
                  />
                </Box>
                <Typography sx={{ flexGrow: 1 }}>{email}</Typography>

                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={router.back}
                  LinkComponent={Link}>
                  <ArrowBackIcon />
                </IconButton>
              </Box>
              <Stack
                ref={chatWindowRef}
                sx={{
                  flex: 1,
                  overflowY: 'scroll',
                  p: 1,
                }}>
                {messages.map((message, i) => (
                  <Fragment key={i}>
                    <Typography alignSelf={'center'} sx={{ color: '#e1e1e1' }}>
                      {CheckDate(message, messages, i)}
                    </Typography>
                    {message.author != session?.user?.email ? (
                      <Stack direction="row" sx={{ maxWidth: '80%' }}>
                        <Box
                          alignSelf={'start'}
                          bgcolor="#292929"
                          sx={{
                            borderRadius: 2,
                            p: 1,
                            px: 2,
                            m: 1,
                            maxWidth: '80vw',
                          }}>
                          {/* <Typography>{typeof message._id}</Typography>
                                            <Typography sx={{fontSize:'10px'}}>{message.time}</Typography> */}
                          {messageElement(
                            message?.type,
                            message?.content,
                            message?.time,
                            message.filetype,
                            false,
                            message
                          )}
                        </Box>
                        <Box mt={1} className={cn(styles.reactionDropdown)}>
                          <Stack
                            className={cn(
                              styles.reactionEmodicons,
                              'reactionEmodicons'
                            )}
                            id={`reactDropdownContent-${i}`}
                            direction="row"
                            spacing={2}>
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 3333)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/3333.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 4444)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/4444.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 5555)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/5555.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 6666)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/6666.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 7777)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/7777.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 8888)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/8888.png"
                            />
                            <Avatar
                              alt="emodicon"
                              onClick={() => reactEmoji(message._id, 9999)}
                              className={cn(styles.reactionEmodicon)}
                              src="/images/emodicons/reaction/9999.png"
                            />
                            <MoreHoriz
                              className="dropBtn"
                              sx={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                              }}
                              onClick={() => reactEmojiMore(i)}
                            />
                          </Stack>
                          <Grid
                            className={cn(
                              styles.reactionEmodiconsMore,
                              'reactionEmodiconsMore'
                            )}
                            id={`reactDropdownContentMore-${i}`}
                            container
                            spacing={2}
                            columns={7}>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 333)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/333.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 444)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/444.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 555)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/555.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 666)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/666.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 777)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/777.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 888)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/888.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 999)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/999.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 33)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/33.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 44)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/44.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 55)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/55.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 66)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/66.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 77)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/77.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 88)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/88.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 99)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/99.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 3)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/3.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 4)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/4.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 5)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/5.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 6)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/6.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 7)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/7.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 8)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/8.png"
                              />
                            </Grid>
                            <Grid item xs={1} md={1}>
                              <Avatar
                                alt="emodicon"
                                onClick={() => reactEmoji(message._id, 9)}
                                className={cn(styles.reactionEmodicon)}
                                src="/images/emodicons/reaction/9.png"
                              />
                            </Grid>
                          </Grid>
                          <svg
                            cursor="pointer"
                            onClick={() => handleReactionDropdown(i)}
                            className={cn(styles.reactionDropBtn, 'dropBtn')}
                            width="16"
                            height="16"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="#8A8D91"
                            gradientcolor1="#8A8D91"
                            gradientcolor2="#8A8D91">
                            <path d="M12 1.999c5.524 0 10.002 4.478 10.002 10.002 0 5.523-4.478 10.001-10.002 10.001-5.524 0-10.002-4.478-10.002-10.001C1.998 6.477 6.476 1.998 12 1.998Zm0 1.5a8.502 8.502 0 1 0 0 17.003A8.502 8.502 0 0 0 12 3.5ZM8.462 14.784A4.491 4.491 0 0 0 12 16.502a4.491 4.491 0 0 0 3.535-1.714.75.75 0 0 1 1.177.93A5.991 5.991 0 0 1 12 18.002a5.991 5.991 0 0 1-4.716-2.29.75.75 0 0 1 1.178-.928ZM9 8.75a1.25 1.25 0 1 1 0 2.499A1.25 1.25 0 0 1 9 8.75Zm6 0a1.25 1.25 0 1 1 0 2.499 1.25 1.25 0 0 1 0-2.499Z"></path>
                          </svg>
                        </Box>
                      </Stack>
                    ) : (
                      <Box
                        alignSelf={'end'}
                        textAlign="right"
                        bgcolor="#0e3b82"
                        sx={{
                          borderRadius: 2,
                          p: 1,
                          px: 2,
                          m: 1,
                          maxWidth: '80vw',
                        }}>
                        {messageElement(
                          message?.type,
                          message?.content,
                          message?.time,
                          message.filetype,
                          true,
                          message
                        )}
                      </Box>
                    )}
                  </Fragment>
                ))}
              </Stack>
              <Box
                sx={{
                  width: '100vw',
                  display: 'flex',
                  p: 2,
                }}>
                {messageType ? (
                  <TextField
                    value={inputValue}
                    sx={{ flexGrow: 1 }}
                    variant="standard"
                    onChange={handleChangeInput}
                    onPaste={handleClipboardPaste}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage(e)
                      }
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      flexGrow: 1,
                      borderRadius: '20px',
                      bgcolor: 'info.main',
                      padding: '0px 20px',
                    }}>
                    <LinearProgressWithLabel
                      value={recordingTime}
                      color="inherit"
                    />
                  </Box>
                )}
                <IconButton
                  sx={{
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    ml: 2,
                  }}
                  disabled={disabledButton}
                  id="sendMessageBtn"
                  onClick={(e) => sendMessage(e)}>
                  {!disabledButton ? <Send /> : <CircularProgress size={20} />}
                </IconButton>
                {messageType ? (
                  <IconButton
                    sx={{
                      bgcolor: 'info.main',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      ml: 2,
                    }}
                    disabled={disabledButton}
                    onClick={() => handleMediaRecorderInit()}>
                    {!disabledButton ? (
                      <MicIcon />
                    ) : (
                      <CircularProgress size={20} />
                    )}
                  </IconButton>
                ) : (
                  <IconButton
                    sx={{
                      bgcolor: 'info.main',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      ml: 2,
                    }}
                    disabled={disabledButton}
                    onClick={() => handleSetMessageType(true)}>
                    {!disabledButton ? (
                      <MailIcon />
                    ) : (
                      <CircularProgress size={20} />
                    )}
                  </IconButton>
                )}
                <IconButton
                  sx={{
                    bgcolor: 'info.main',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    ml: 1,
                  }}
                  disabled={disabledButton}>
                  <label htmlFor="icon-button-file">
                    {!disabledButton ? (
                      <AttachFileIcon />
                    ) : (
                      <CircularProgress size={20} />
                    )}
                  </label>
                  <input
                    accept="*.jpg,.jpeg,.png,.gif,.bmp,.mp4,.mov,.avi*"
                    id="icon-button-file"
                    type="file"
                    onChange={(e) => asyncupload(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </IconButton>
                <CallButton
                  onClick={initiateCall}
                  isCalling={isCalling}
                  beingCalled={beingCalled}
                  minimizeCall={minimizeCall}
                  setMiniCall={(value: boolean) => {
                    setMinimizeCall(value)
                  }}
                />
              </Box>
            </Box>
            <MediaViewer
              open={open}
              handleClose={handleClose}
              content={selectedContent}
            />
          </FullLayout>
        </IsCallingContext.Provider>
      </CacheProvider>
    </StyledEngineProvider>
  )
}
export async function getServerSideProps({ req }: { req: NextApiRequest }) {
  const session = await getSession({
    req,
  })

  if (!session) {
    return {
      redirect: {
        destination: '/signin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      session,
    },
  }
}
