import React, { Fragment, useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import FullLayout from '@layouts/FullLayout/FullLayout'
import { Send, VideoCameraFront } from '@mui/icons-material'
import { MoreHoriz } from '@mui/icons-material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import {
  IconButton,
  Stack,
  TextField,
  Typography,
  Avatar,
  Grid,
} from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import Box from '@mui/material/Box'
import { NextApiRequest } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import io from 'socket.io-client'
import { formatTime, timestampToFormattedDate } from '@lib/utils'
import Link from 'next/link'
import {
  ContentReactedEmojis,
  EmojiChildComponent,
} from '@elements/ContentReactedEmojis'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
import { StyledEngineProvider } from '@mui/material/styles'
import { useAtom } from 'jotai'
import { usersAtom } from '../../atoms'
import cn from 'classnames'
import stringAvatar from '../../components/elements/StringAvatar'
import styles from '../../styles/chat.module.scss'
import FormModal from '@elements/groupChat/FormModal'
import ChatImage from '@elements/groupChat/ChatImage'
import VideoCallRoom from '@elements/groupChat/VideoCallRoom'

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

type Message = {
  _id: string
  posterName: string
  posterEmail: string
  type: string
  content: string
  groupId: string
  date: string
  time: string
  readers: Array<string>
}

let socket: any

export default function GroupChat() {
  const router = useRouter()
  const groupId = router.query.id
  const { data: session } = useSession()
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const [group, setGroup] = useState<any>(null)
  const [messages, setMessages] = useState<Array<Message>>([])
  const [messagess, setMessagess] = useState<Array<Message>>([])
  const [inputMsg, setInputMsg] = useState('')
  const [members, setMembers] = useState([])
  const [usersStore, setUsersStore] = useAtom(usersAtom)
  const [changeState, setChangeState] = useState<Boolean>(false)
  const [IsCallRoom, setIsCallRoom] = useState<Boolean>(false)

  const fetchGroupInfo = async () => {
    const response = await fetch(`/api/message/groups?id=${groupId}`)
    const jsonData = await response.json()
    console.log(jsonData, 'jsondata')
    setGroup(jsonData.group)
  }
  async function fetchMsg() {
    const response = await fetch(`/api/message/getGroupMsgs?id=${groupId}`)
    const jsonData = await response.json()
    setMessages(() => [...jsonData.groupMsgs])
    setMessagess(() => [...jsonData.groupMsgs])
  }
  async function fetchMembersInfo() {
    const response = await fetch(`/api/message/getMembers?id=${groupId}`)
    const jsonData = await response.json()
    setMembers(jsonData.members)
  }

  useEffect(() => {
    fetchGroupInfo()
    fetchMsg()
    fetchMembersInfo()

    socket = io(`${String(process.env.NEXT_PUBLIC_CHAT_URI)}/groupchat`, {
      secure: true,
    })
    socket.on('connect', () => {
      socket.emit('identity_group', {
        groupId: groupId,
        email: session?.user?.email,
        name: session?.user?.name,
      })
    })
    socket.on('connectToRoom', (data: any) => {})
    // receive new chat with newchatId for updating read status
    socket.on('newMessage', (data: Message) => {
      setMessages((previousMsgs) => [...previousMsgs, data])
    })
    // receive new chat first for speedup
    socket.on('newMessageFirst', (data: Message) => {
      setMessagess((previousMsgs) => [...previousMsgs, data])
    })

    socket.on(
      'newReactEmoji',
      ({ msgId, emojiId }: { msgId: string; emojiId: string }) => {
        showReactedEmoji(msgId, emojiId)
      }
    )

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
    fetchGroupInfo()
    fetchMsg()
    fetchMembersInfo()
  }, [changeState])

  // Place the new chats for placeholder
  useEffect(() => {
    const chatWindow = chatWindowRef.current
    if (chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight
  }, [messagess])

  // Update unread status
  useEffect(() => {
    const myemail: any = session?.user?.email
    const unreadchats = messages.filter(
      (message) => !message.readers.includes(myemail)
    )
    // console.log('unreadchats', unreadchats);
    ;(async () => {
      const payload = { readchats: unreadchats }
      try {
        const res = await fetch('/api/message/readGroupMsg', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.log(error)
      }
    })()
  }, [messages])

  const CheckDate = (message: Message, messages: Array<Message>, i: number) => {
    if (messages[i - 1] === undefined) {
      return message.date
    }
    if (messages[i - 1].date == !messages.date) {
      return message.date
    }
  }

  const sendMessage = (e: any) => {
    e.preventDefault()
    const message = {
      posterName: session?.user?.name,
      posterEmail: session?.user?.email,
      type: 'text',
      content: inputMsg,
      groupId: groupId,
      date: timestampToFormattedDate(Date.now()),
      time: formatTime(),
      readers: [session?.user?.email],
    }
    if (!message) return
    if (inputMsg.trim() == '') return
    socket.emit('sendMessageFirst', { ...message })

    const saveMsg = async () => {
      const payload = { message: message }
      try {
        const response = await fetch('/api/message/newGroupMsg', {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const res = await response.json()
        if (res.message === 'Success') {
          socket.emit('sendMessage', {
            message: { ...message, _id: res.newChatInfo.insertedId },
            groupInfo: group,
          })
        }
      } catch (error) {
        console.log(error)
      }
    }
    saveMsg()
    setInputMsg('')
  }

  const handleIsCallRoom = (value: boolean) => {
    setIsCallRoom(value)
  }

  const setChangeStateHandler = () => {
    setChangeState((preState) => !preState)
  }

  const handleReactionDropdown = (index: number) => {
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
  }

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

  const reactEmoji = async (msgId: string, emojiId: number) => {
    const res = await fetch('/api/message/reactEmojiGroup', {
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
    socket.emit('reactEmojiGroup', { msgId, emojiId, groupInfo: group })
  }

  const reactEmojiMore = (index: number) => {
    const element = document.getElementById(`reactDropdownContentMore-${index}`)
    element?.classList.toggle('showDropdownContent')
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
    name: string,
    message: Message
  ) => {
    return (
      <div>
        {
          // type == "media" ?
          // (filetype == "image" ? <ChatImage content={content} filetype={filetype} />
          // : <video src={`/api/view?name=${content}`} width={160} height={90} ></video>)
          // :
          <Typography className={cn('msgText')} variant="body1">
            {content}
          </Typography>
        }
        <Typography
          className={cn('msgText')}
          sx={{ fontSize: '10px' }}>{`${name}, ${time}`}</Typography>
        <ContentReactedEmojis message={message} />
      </div>
    )
  }
  return (
    <StyledEngineProvider injectFirst>
      <CacheProvider value={cache}>
        <FullLayout title="Chat" appbar={false}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              width: '100vw',
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
                <FormModal
                  users={usersStore}
                  groupInfo={group}
                  members={members}
                  setChangeState={setChangeStateHandler}
                />
              </Box>
              <Typography sx={{ flexGrow: 1, color: 'white' }} variant="h5">
                {group?.title}
              </Typography>

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
                overflowY: 'auto',
                p: 1,
              }}>
              {messagess.map((message, i) => {
                const me: any = members.find((member: any) => {
                  return member.email === message.posterEmail
                })
                return (
                  <Fragment key={i}>
                    <Typography alignSelf={'center'} sx={{ color: '#e1e1e1' }}>
                      {CheckDate(message, messages, i)}
                    </Typography>
                    {message.posterEmail != session?.user?.email ? (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ m: 1, justifyContent: 'start' }}>
                        {me?.picpath ? (
                          <Avatar
                            className={cn('avatar')}
                            alt={`${message.posterName}`}
                            src={`/api/view?name=chats/${me?.picpath}`}
                          />
                        ) : (
                          <Avatar
                            className={cn('avatar')}
                            {...stringAvatar(`${message.posterName}`)}
                          />
                        )}
                        <Box
                          alignSelf={'start'}
                          bgcolor="#292929"
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            px: 2,
                            maxWidth: '70%',
                          }}>
                          {/* <Typography>{message.content}</Typography>
                                      <Typography sx={{fontSize:'10px'}}>{message.time}</Typography> */}
                          {messageElement(
                            message?.type,
                            message?.content,
                            message?.time,
                            message.posterName,
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
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ m: 1, justifyContent: 'end' }}>
                        <Box
                          bgcolor="#0e3b82"
                          sx={{
                            borderRadius: 2,
                            py: 1,
                            px: 2,
                            maxWidth: '70%',
                          }}>
                          {messageElement(
                            message?.type,
                            message?.content,
                            message?.time,
                            message.posterName,
                            message
                          )}
                        </Box>
                        {session?.user?.image ? (
                          <Avatar
                            className={cn('avatar')}
                            alt={`${session?.user?.name}`}
                            src={`/api/view?name=chats/${session?.user?.image}`}
                          />
                        ) : (
                          <Avatar
                            className={cn('avatar')}
                            {...stringAvatar(`${session?.user?.name}`)}
                          />
                        )}
                      </Stack>
                    )}
                  </Fragment>
                )
              })}
            </Stack>
            <Box
              sx={{
                width: '100vw',
                display: 'flex',
                p: 2,
              }}>
              <TextField
                value={inputMsg}
                sx={{ flexGrow: 1 }}
                variant="standard"
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    sendMessage(e)
                  }
                }}
              />
              <IconButton
                sx={{
                  bgcolor: 'info.main',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  ml: 2,
                }}
                onClick={(e) => {
                  sendMessage(e)
                }}>
                <Send />
              </IconButton>
              <IconButton
                sx={{
                  bgcolor: 'info.main',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  ml: 2,
                }}
                onClick={(e) => {
                  handleIsCallRoom(true)
                }}>
                <VideoCameraFront />
              </IconButton>
            </Box>
          </Box>
          {IsCallRoom && (
            <VideoCallRoom handleClose={handleIsCallRoom} group={group} />
          )}
        </FullLayout>
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
