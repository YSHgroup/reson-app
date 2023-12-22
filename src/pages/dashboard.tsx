import { getSession, useSession, signOut } from 'next-auth/react'
import BasicLayout from '@layouts/BasicLayout'
import Box from '@mui/material/Box'
import Image from 'next/image'
import Typography from '@mui/material/Typography'
import CssBaseline from '@mui/material/CssBaseline'
import { NextApiRequest } from 'next'
import { green } from '@mui/material/colors'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Link from 'next/link'
import ButtonBase from '@mui/material/ButtonBase'
import { Fade, ListItemIcon, Menu, MenuItem } from '@mui/material'
import React, { useEffect } from 'react'
import { MenuData } from '@constants/Menu.js'
import { useSwipe } from 'hooks/useSwipe'
import { useRouter } from 'next/router'
import { language } from '../jotai'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import NotificationChat from '../components/elements/NotificationChat'
import NotificationCalendar from '../components/elements/NotificationCalendar'
import io from 'socket.io-client'

const { data: MenuDatas } = MenuData
let socket: any

export default function Home() {
  const { data: session } = useSession()
  const [lang, setLanguage] = useAtom(language)
  const energy = 54
  const opportunity = 21
  const [unread, SetUnread] = React.useState(0)
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [totalUnreadChats, setTotalUnreadChats] = React.useState<any>([])
  const [isNotificationCalendar, setIsNotificationCalendar] =
    React.useState<boolean>(false)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const router = useRouter()
  const { isDragging } = useSwipe({
    up: () => {
      router.push('/create')
    },
    down: () => {
      router.push('/search')
    },
    left: () => {
      router.push('/calendar')
    },
    right: () => {
      router.push('/messages')
    },
  })

  const routerToProfile = () => {
    router.push('/profile')
  }

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: process.env.NEXT_PUBLIC_BASE_URL + '/signin',
      })
    } catch (error) {
      console.error('There was an error signing out:', error)
    }
  }

  useEffect(() => {
    // Todo

    const getCurrentSetting = async () => {
      try {
        const response = await fetch('/api/setting/currentSetting', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      let settingData = await response.json()
      // console.log('Bug tracking:',settingData.data , JSON.stringify(settingData))
      if (!settingData.data || !settingData.data.language) throw new Error
      localStorage.setItem('language', settingData.data.language)
      setLanguage(settingData.data.language)
      } catch (error) {
        await fetch('/api/setting/setting', {
          method: 'POST',
          body: JSON.stringify({
            language: 0,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        localStorage.setItem('language', '0')
      setLanguage(0)
      }
    }

    getCurrentSetting()
  }, [])

  const getUnreadMessage = async () => {
    const response = await fetch('/api/message/getUnreadMessages', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    let data = await response.json()
    if (data.data.count > 0) {
      SetUnread(data.data.count)
      setTotalUnreadChats(() => [...data.data.totalUnreadChats])
    }
  }

  useEffect(() => {
    socket = io(String(process.env.NEXT_PUBLIC_CHAT_URI), { secure: true })
    socket.on('connect', () => {
      socket.emit('dashboard_notification', { email: session?.user?.email })
    })
    socket.on('newChat', () => {
      getUnreadMessage()
    })
    getUnreadMessage()
  }, [])

  return (
    <BasicLayout title="Dashboard">
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          p: 1,
        }}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            visibility: isDragging ? 'hidden' : 'visible',
          }}>
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            LinkComponent={Link}
            href="/settings">
            <Image
              src="/images/setting.png"
              alt="setting"
              width={50}
              height={50}
            />
          </IconButton>
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            onClick={handleClick}>
            <Image src="/images/menu.png" alt="menu" width={50} height={50} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            TransitionComponent={Fade}>
            {MenuDatas.map(
              ({ name, href }, i) =>
                i !== 2 && (
                  <MenuItem key={name[0]} dense>
                    <Box
                      component={Link}
                      href={href}
                      sx={{ display: 'inherit' }}>
                      <ListItemIcon>
                        <Image
                          src={`/images/${name[0]}.png`}
                          alt={name[0][lang]}
                          width={20}
                          height={20}
                        />
                      </ListItemIcon>
                      {name[lang]}
                    </Box>
                  </MenuItem>
                )
            )}
            <MenuItem key={'profile'} dense>
              <Box
                component={Link}
                href={'/profile'}
                sx={{ display: 'inherit' }}>
                <ListItemIcon>
                  <Image
                    src={`/images/profile.png`}
                    alt={'profile'}
                    width={20}
                    height={20}
                  />
                </ListItemIcon>
                Profile
              </Box>
            </MenuItem>
            <MenuItem dense onClick={() => handleSignOut()}>
              {languagejson[lang].signOut}
            </MenuItem>
          </Menu>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            textAlign: 'center',
            position: 'relative',
            flexDirection: 'column',
          }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              left: 12,
              height: '100%',
              width: 24,
              backgroundImage: 'url(/images/statusbar.png)',
              backgroundSize: '100% 100%',
              visibility: isDragging ? 'hidden' : 'visible',
            }}>
            <Typography
              sx={{
                transform: 'rotate(90deg)',
                fontSize: 18,
              }}>
              {languagejson[lang].OPPORTUNITY}
            </Typography>
            <Typography
              sx={{
                width: '42px',
                lineHeight: '28px',
                backgroundColor: 'rgb(227,171,177)',
                color: 'white',
                textAlign: 'center',
                borderRadius: '0 6px 6px 0',
                position: 'absolute',
                bottom: `calc(${opportunity}% - 14px)`,
                left: 38,
                paddingLeft: '-2px',
                '&::after': {
                  content: '" "',
                  position: 'absolute',
                  left: '-13px',
                  top: '0',
                  marginLeft: '-14px',
                  borderWidth: '14px',
                  borderStyle: 'solid',
                  borderColor:
                    'transparent rgb(227,171,177) transparent transparent',
                },
              }}>
              {opportunity}%
            </Typography>
          </Box>
          <ButtonBase href="/search" sx={{width: '50%', margin: '0 auto'}} LinkComponent={Link}>
            <Typography
              variant="h4"
              sx={{
                opacity: isDragging ? 1 : 0.5,
              }}>
              {languagejson[lang].NEED}
            </Typography>
          </ButtonBase>

          {isDragging && (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                src="/images/arrow.png"
                alt="left"
                width={100}
                height={100}
                style={{
                  transform: 'rotate(90deg)',
                }}
              />
            </Box>
          )}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              right: 12,
              height: '100%',
              width: 24,
              backgroundImage: 'url(/images/statusbar.png)',
              backgroundSize: '100% 100%',
              visibility: isDragging ? 'hidden' : 'visible',
            }}>
            <Typography
              sx={{
                transform: 'rotate(-90deg)',
                fontSize: 18,
              }}>
              {languagejson[lang].ENERGY}
            </Typography>
            <Typography
              sx={{
                width: '42px',
                lineHeight: '28px',
                backgroundColor: green[200],
                color: 'black',
                textAlign: 'center',
                borderRadius: '6px 0 0 6px',
                position: 'absolute',
                bottom: `calc(${energy}% - 14px)`,
                right: 38,
                '&::after': {
                  content: '" "',
                  position: 'absolute',
                  left: 'calc(100% + 14px)',
                  top: '0',
                  marginLeft: '-14px',
                  borderWidth: '14px',
                  borderStyle: 'solid',
                  borderColor: `transparent transparent transparent ${green[200]}`,
                },
              }}>
              {energy}%
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            LinkComponent={Link}
            href="/messages"
            className="messagesLink">
            {unread > 0 ? (
              <Badge badgeContent={unread} color="error">
                <Image
                  src="/images/mail.png"
                  alt="mail"
                  width={50}
                  height={50}
                />
              </Badge>
            ) : (
              <Badge color="error">
                <Image
                  src="/images/mail.png"
                  alt="mail"
                  width={50}
                  height={50}
                />
              </Badge>
            )}
          </IconButton>
          <NotificationChat totalUnreadChats={totalUnreadChats} />
          {isDragging && (
            <Image src="/images/arrow.png" alt="left" width={50} height={50} />
          )}

          <Box
            sx={{
              height: 50,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <IconButton
              sx={{
                ':hover': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
                },
                position: 'absolute',
              }}
              onClick={() => routerToProfile()}
              >
              <Image
                src="/images/main.png"
                alt="main"
                width={100}
                height={100}
                priority
                // onClick={() => routerToProfile()}
              />
              <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: '10',
                cursor: 'pointer',
              }}
              ></div>
              <Typography
              variant="h2"
              sx={{
                position: 'absolute',
                color: 'white',
              }}>
              I
            </Typography>
            </IconButton>
            {/* <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: '10',
                cursor: 'pointer',
              }}
              onClick={() => routerToProfile()}></div> */}
            {/* <Typography
              variant="h2"
              sx={{
                position: 'absolute',
                color: 'white',
              }}>
              I
            </Typography> */}
          </Box>

          {isDragging && (
            <Image
              src="/images/arrow.png"
              alt="left"
              width={50}
              height={50}
              style={{ transform: 'rotate(180deg)' }}
            />
          )}
          {isNotificationCalendar && <NotificationCalendar />}
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            LinkComponent={Link}
            href="/calendar"
            onMouseOver={() => {
              setIsNotificationCalendar(true)
            }}
            onMouseLeave={() => {
              setIsNotificationCalendar(false)
            }}>
            <Image
              src="/images/calendar.png"
              alt="calendar"
              width={50}
              height={50}
            />
          </IconButton>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column-reverse',
            textAlign: 'center',
            position: 'relative',
          }}>
          <ButtonBase href="/create" sx={{width: '50%', margin: '0 auto'}} LinkComponent={Link}>
            <Typography
              variant="h4"
              sx={{
                opacity: isDragging ? 1 : 0.5,
              }}>
              {languagejson[lang].CAN}
            </Typography>
          </ButtonBase>
          {isDragging && (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Image
                src="/images/arrow.png"
                alt="left"
                width={100}
                height={100}
                style={{
                  transform: 'rotate(-90deg)',
                }}
              />
            </Box>
          )}
          <Box
            width={'20px'}
            height={'100%'}
            bgcolor={'white'}
            marginLeft={'13px'}
            border={'2px solid lime'}
            borderRadius={'5px'}
          >

          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            visibility: isDragging ? 'hidden' : 'visible',
          }}>
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            LinkComponent={Link}
            href="/messages?group=2">
            <Image
              src="/images/contact.png"
              alt="contact"
              width={50}
              height={50}
            />
          </IconButton>
          <IconButton
            sx={{
              ':hover': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? '#00000066' : '#ffffff19',
              },
            }}
            LinkComponent={Link}
            href="/projects">
            <Image
              src="/images/create.png"
              alt="create"
              width={50}
              height={50}
            />
          </IconButton>
        </Box>
      </Box>
    </BasicLayout>
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
