import Image from 'next/image'
import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  Badge,
  Box,
  Divider,
  IconButton,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Tab,
  Tabs,
  Stack,
  Button,
  Modal,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Close, Margin } from '@mui/icons-material'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import { NextApiRequest } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { language } from '../jotai'
import languagejson from '../language.json'
import ColorModeContext from 'context/ColorModeContext'
import Autocomplete from '@mui/material/Autocomplete'
import cn from 'classnames'
import { useAtom } from 'jotai'
import { usersAtom } from '../atoms'
import { styled } from '@mui/material/styles'

let socket: any
import io from 'socket.io-client'
import { people } from 'googleapis/build/src/apis/people'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    width: '500px',
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
    minWidth: '50%',
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}))

interface UserObject {
  code_send_time: string
  day: string
  day_birth: string
  email: string
  enable: string
  hour: string
  min: string
  month: string
  month_birth: string
  msgs: any
  nickname: string
  password: string
  picpath: string
  sec: string
  sex: string
  status: string
  unreadCount: string
  verify_code: string
  year: string
  year_birth: string
  _id: string
}

interface ContactObject {
  _id: string
  author: string
  name: string
  emailAddress: string
  photo: string
  birthday: string
  phoneNumber: string
}

export default function Messages() {
  const { data: session } = useSession()
  const [lang, setLanguage] = useAtom(language)
  const [users, setUsers] = React.useState<any>([])
  const [unReads, setUnReads] = React.useState<Array<any>>([])
  const [chatGroups, setChatGroups] = React.useState<Array<any>>([])
  const [addGroup, setAddGroup] = React.useState(false)
  const [usersStore, setUsersStore] = useAtom(usersAtom)
  // const [unreadGroupChats, setUnreadGroupChats] = React.useState<Array<any>>([]);
  const [contacts, setContacts] = React.useState<Array<any>>([])

  const [userInfo, setUserInfo] = React.useState<UserObject>({
    code_send_time: '',
    picpath: '',
    day: '',
    day_birth: '',
    email: '',
    enable: '',
    hour: '',
    min: '',
    month: '',
    month_birth: '',
    msgs: '',
    nickname: '',
    password: '',
    sec: '',
    sex: '',
    status: '',
    unreadCount: '',
    verify_code: '',
    year: '',
    year_birth: '',
    _id: '',
  })
  const [showUserModal, setShowUserModal] = React.useState<boolean>(false)

  const [contactInfo, setContactInfo] = React.useState<ContactObject>({
    _id: '',
    author: '',
    name: '',
    emailAddress: '',
    photo: '',
    birthday: '',
    phoneNumber: '',
  })
  const [showContactModal, setShowContactModal] = React.useState<boolean>(false)

  const getChatGroups = async () => {
    const response = await fetch('/api/message/groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res = await response.json()
    let sorted_groups = res.groups
    sorted_groups.sort((a: any, b: any) => {
      if (a.unreadchats.length > 0 && b.unreadchats.length == 0) return -1
      if (a.unreadchats.length == 0 && b.unreadchats.length > 0) return 1
      if (a.modified < b.modified) return 1
      return -1
    })
    setChatGroups((groups) => [...res.groups])
  }

  React.useEffect(() => {
    const getUnreadMessage = async () => {
      const response = await fetch('/api/message/getUnreadMessages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      let data = await response.json()

      if (data.data.count > 0) {
        setUnReads(data.data.messages)
        // let sorted_users = users;
        // data.data.messages.forEach((msg: any, i: number ) => {
        //   sorted_users.sort((user1: any, user2: any) => {
        //     if (user1.email == msg.author) return true;
        //   })
        // })
        // setUsers(sorted_users)
      }
    }

    // const getUnreadGroupChats = async () => {
    //   const response = await fetch('/api/message/getUnreadGroupChats',{
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     }
    //   })

    //   let data = await response.json()

    //   console.log('getUnreadGroupChats', data)

    //   if(data.data.count > 0){
    //     setUnreadGroupChats(data.data.unreadGroupChats)
    //   }
    // }

    getUnreadMessage()
    // getUnreadGroupChats();

    socket = io(String(process.env.NEXT_PUBLIC_CHAT_URI), { secure: true })
    socket.on('connect', () => {
      socket.emit('register_notificationSocket', {
        email: session?.user?.email,
      })
    })
    socket.on('newUnreadMsg', () => {
      getUnreadMessage()
    })
    socket.on('newUnreadGroupChat', () => {
      getChatGroups()
    })
  }, [])

  React.useEffect(() => {
    getChatGroups()
  }, [addGroup])
  const getContacts = async () => {
    const response = await fetch('/api/contact/contact', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const resData = await response.json()
    if (resData.message === 'Success') {
      setContacts(resData.data)
    }
  }
  React.useEffect(() => {
    getContacts()
  }, [])

  React.useState<Array<any>>([])

  React.useEffect(() => {
    const getUser = async () => {
      const response = await fetch('/api/user/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      let userData = await response.json()

      let users_sorted = userData.data
      users_sorted.sort(function (user1: any, user2: any) {
        if (user1.unreadCount > 0 && user2.unreadCount == 0) return -1
        if (user1.unreadCount == 0 && user2.unreadCount > 0) return 0
        if (user2.msgs.length == 0) return -1
        if (user1.msgs.length == 0 && user2.msgs.length > 0) return 0
        const msg1 = user1.msgs.slice(-1)
        const msg2 = user2.msgs.slice(-1)
        // const date1 = msg1[0].date.split("/").reverse().concat(msg1[0].time.split(":"));
        // const date2 = msg2[0].date.split("/").reverse().concat(msg2[0].time.split(":"));
        let date1 = msg1[0].date.split('/')
        let date2 = msg2[0].date.split('/')
        ;[date1[0], date1[1], date1[2]] = [date1[2], date1[0], date1[1]]
        ;[date2[0], date2[1], date2[2]] = [date2[2], date2[0], date2[1]]
        date1 = date1.concat(msg1[0].time.split(':'))
        date2 = date2.concat(msg2[0].time.split(':'))
        if (user1.msgs.length > 0 && user2.msgs.length > 0)
          for (let i = 0; i < date1.length; i++) {
            if (date1[i] == date2[i]) continue
            if (date1[i] > date2[i]) return -1
            else return 0
          }
      })
      // let temp;
      // for (let i = 0; i < users_sorted.length - 1; i ++) {
      //   for (let j = i + 1; j < users_sorted.length; j ++) {
      //     // if (users_sorted[i] < users_sorted[j]) {
      //     //   temp = users_sorted[i];
      //     //   users_sorted[i] = users_sorted[j];
      //     //   users_sorted[j] = temp;
      //     // }
      //     if ( users_sorted[i].unreadCount == 0 && users_sorted[j].unreadCount > 0 ) {
      //         temp = users_sorted[i];
      //         users_sorted[i] = users_sorted[j];
      //         users_sorted[j] = temp;
      //     }
      //   }
      // }

      setUsers(users_sorted)
      // setUsers([...userData.data])
    }
    getUser()
  }, [unReads])

  React.useEffect(() => {
    setUsersStore(users)
  }, [users])

  // React.useEffect(() => {
  //   console.log("users data updated=", users)
  // }, [users])

  const router = useRouter()
  const group = parseInt(router.query.group as string) || 0
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    router.replace('/messages?group=' + newValue)
  }
  const handleImportClick = async () => {
    window.location.href = 'api/contact/google-auth'
  }
  const AddContact = (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
      <Typography sx={{ flexGrow: 1 }}>
        {languagejson[lang].Newcontact}
      </Typography>
      <IconButton>
        <img src="/images/create.png" alt="create" width={20} height={20} />
      </IconButton>
    </Box>
  )

  const handleShowProfile = (user: any) => {
    setUserInfo(user)
    setShowUserModal(true)
  }

  const handleShowUserModalClose = () => {
    setShowUserModal(false)
    setUserInfo({
      code_send_time: '',
      picpath: '',
      day: '',
      day_birth: '',
      email: '',
      enable: '',
      hour: '',
      min: '',
      month: '',
      month_birth: '',
      msgs: '',
      nickname: '',
      password: '',
      sec: '',
      sex: '',
      status: '',
      unreadCount: '',
      verify_code: '',
      year: '',
      year_birth: '',
      _id: '',
    })
  }

  const handleShowContact = (contact: any) => {
    setContactInfo(contact)
    setShowContactModal(true)
  }

  const handleShowContactModalClose = () => {
    setShowContactModal(false)
    setContactInfo({
      _id: '',
      author: '',
      name: '',
      emailAddress: '',
      photo: '',
      birthday: '',
      phoneNumber: '',
    })
  }

  return (
    <FullLayout title={languagejson[lang].Message}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', padding: '10px' }}>
        <Tabs value={group} onChange={handleChange}>
          <Tab label={languagejson[lang].chats} />
          <Tab label={languagejson[lang].group} />
          <Tab label={languagejson[lang].contacts} />
        </Tabs>
        {group == 1 && (
          <FormModal
            users={users}
            addGroup={() => setAddGroup((addGroup) => !addGroup)}
          />
        )}
        {group == 2 && (
          <Button
            sx={{
              marginRight: '5px',
              textTransform: 'none',
              marginBottom: '12px',
            }}
            variant="contained"
            onClick={handleImportClick}>
            Import Contact
          </Button>
        )}
      </Stack>
      {/* BEGIN: CHATS SECTION */}
      {group === 0 && (
        <>
          <List
            sx={{
              width: '100vw',
            }}>
            {users.map((user: any, i: number) => (
              <>
                {i !== 0 && <Divider />}
                <ListItemButton
                  key={user._id}
                  href={`/chat?email=${user.email}`}
                  LinkComponent={Link}>
                  <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="h4">{user.nickname}</Typography>
                    <Typography>{user.email}</Typography>
                  </Stack>
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleShowProfile(user)
                    }}
                    sx={{
                      // background: (user.sex != null ? (user.sex == 'male' ? 'rgb(0,176,240)' : 'rgb(255,18,239)') : 'rgb(47,255,79)'),
                      background: 'rgb(0,176,240)',
                      borderRadius: 2,
                      padding: 0,
                    }}>
                    <Badge
                      badgeContent={
                        unReads.filter((item) => item.author == user.email)
                          .length
                      }
                      color="error">
                      <Image
                        src={
                          !user.picpath
                            ? `/images/${!!user.sex ? user.sex : 'male'}.png`
                            : `/api/view?name=chats/${user.picpath}`
                        }
                        alt={user.sex != null ? user.sex : ''}
                        width={70}
                        height={70}
                      />
                    </Badge>
                  </IconButton>
                </ListItemButton>
              </>
            ))}
          </List>
          <BootstrapDialog
            onClose={handleShowUserModalClose}
            aria-labelledby="customized-dialog-title"
            open={showUserModal}>
            <DialogTitle
              sx={{
                m: 0,
                p: 2,
              }}
              id="customized-dialog-title">
              {userInfo?.email}
            </DialogTitle>
            <IconButton
              aria-label="close"
              onClick={handleShowUserModalClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}>
              <Close />
            </IconButton>
            <DialogContent dividers>
              <Box
                sx={{
                  '& .MuiTextField-root': { m: 1 },
                }}
                component="form"
                noValidate
                autoComplete="false">
                <Stack sx={{ flexGrow: 1 }}>
                  <Image
                    src={
                      userInfo?.picpath
                        ? `/api/view?name=chats/${userInfo.picpath}`
                        : `/images/${userInfo.sex ? userInfo.sex : 'male'}.png`
                    }
                    alt={userInfo.sex != null ? userInfo.sex : ''}
                    width={150}
                    height={150}
                    style={{
                      margin: 'auto',
                      borderRadius: '5px',
                    }}
                  />
                  <Typography variant="subtitle1">
                    Username: {userInfo?.nickname}
                  </Typography>
                  <Typography variant="subtitle1">
                    Gender: {userInfo?.sex}
                  </Typography>
                  <Typography variant="subtitle1">
                    Birthday:
                    {`${userInfo?.year_birth}-${userInfo?.month_birth}-${userInfo?.day_birth}`}
                  </Typography>
                </Stack>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleShowUserModalClose} variant="contained">
                Close
              </Button>
            </DialogActions>
          </BootstrapDialog>
        </>
      )}
      {/* END: CHATS SECTION */}
      {/* BEGIN: GROUPS SECTION */}
      {group === 1 && (
        <List
          sx={{
            width: '100vw',
          }}>
          {chatGroups.length > 0 &&
            chatGroups.map((item, i) => (
              <>
                {i !== 0 && <Divider />}
                <ListItemButton
                  key={item._id}
                  LinkComponent={Link}
                  href={`/groupchat/${item._id}`}>
                  <ListItemText>
                    <Typography variant="h4">{item.title}</Typography>
                  </ListItemText>
                  <IconButton>
                    <Badge
                      badgeContent={item.members.length}
                      color="success"
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}>
                      <Badge
                        badgeContent={item.unreadchats.length}
                        color="error">
                        <Image
                          src={
                            item.groupAvatar
                              ? `/api/view?name=chats/${item.groupAvatar}`
                              : `/images/group.png`
                          }
                          alt={item.title}
                          width={50}
                          height={50}
                        />
                      </Badge>
                    </Badge>
                  </IconButton>
                </ListItemButton>
              </>
            ))}
        </List>
      )}
      {/* END: GROUP SECTION */}
      {/* BEGIN: CONTACTS SECTION */}
      {group === 2 && (
        <>
          <List
            sx={{
              width: '100vw',
            }}
            // subheader={AddContact}
          >
            {contacts.map((contact: any, i: number) => (
              <>
                {i !== 0 && <Divider />}
                <ListItemButton
                  key={contact._id}
                  // href="/profile"
                  LinkComponent={Link}>
                  <Stack sx={{ flexGrow: 1 }}>
                    <Typography variant="h4">{contact.name}</Typography>
                    <Typography>{contact.emailAddress}</Typography>
                  </Stack>
                  <IconButton
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleShowContact(contact)
                    }}
                    sx={{
                      background:
                        contact.sex != null
                          ? contact.sex == 'male'
                            ? 'rgb(0,176,240)'
                            : 'rgb(255,18,239)'
                          : 'rgb(47,255,79)',
                      borderRadius: 2,
                    }}>
                    <Badge badgeContent={0} color="error">
                      <Image
                        src={
                          contact.photo === null
                            ? `/images/${
                                contact.sex != null ? contact.sex : 'male'
                              }.png`
                            : contact.photo
                        }
                        alt={contact.sex != null ? contact.sex : ''}
                        width={50}
                        height={50}
                      />
                    </Badge>
                  </IconButton>
                </ListItemButton>
              </>
            ))}
          </List>
          <BootstrapDialog
            onClose={handleShowContactModalClose}
            aria-labelledby="customized-dialog-title"
            open={showContactModal}>
            <DialogTitle
              sx={{
                m: 0,
                p: 2,
              }}
              id="customized-dialog-title">
              {contactInfo?.emailAddress}
            </DialogTitle>
            <IconButton
              aria-label="close"
              onClick={handleShowContactModalClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}>
              <Close />
            </IconButton>
            <DialogContent dividers>
              <Box
                sx={{
                  '& .MuiTextField-root': { m: 1 },
                }}
                component="form"
                noValidate
                autoComplete="false">
                <Stack sx={{ flexGrow: 1 }}>
                  <Image
                    src={contactInfo?.photo}
                    alt={contactInfo?.name}
                    width={150}
                    height={150}
                    style={{
                      margin: 'auto',
                      borderRadius: '5px',
                    }}
                  />
                  <Typography variant="subtitle1">
                    Username: {contactInfo?.name}
                  </Typography>
                  <Typography variant="subtitle1">
                    Birthday: {contactInfo?.birthday}
                  </Typography>
                  <Typography variant="subtitle1">
                    Phone: {contactInfo?.phoneNumber}
                  </Typography>
                </Stack>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleShowContactModalClose} variant="contained">
                Close
              </Button>
            </DialogActions>
          </BootstrapDialog>
        </>
      )}
      {/* END: CONTACTS SECTION */}
    </FullLayout>
  )
}
const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 450,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

export function FormModal({ users, addGroup }) {
  const [open, setOpen] = React.useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const { mode, toggleColorMode } = React.useContext(ColorModeContext)
  const [groupName, setGroupName] = React.useState('')
  const { data: session } = useSession()
  const [selectedPeople, setSelectedPeople] = React.useState([])
  const handleAddPeople = (event: any, value: any) => {
    setSelectedPeople(value)
  }
  const [selectedImage, setSelectedImage] = React.useState<string | undefined>(
    undefined
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | undefined>(undefined)

  const newGroupChat = async () => {
    if (selectedPeople.length === 0) {
      return
    }
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'fields',
        JSON.stringify({
          people: selectedPeople,
          groupName,
        })
      )

      const response = await fetch('/api/message/newGroup_file', {
        method: 'POST',
        body: formData,
      })
      handleClose()
      const res = await response.json()
      if (res.message === 'Success') {
        handleClose()
        addGroup()
        setSelectedPeople([])
        setSelectedImage(undefined)
        setFile(undefined)
      }
    } else {
      const response = await fetch('/api/message/newGroup', {
        method: 'POST',
        body: JSON.stringify({
          people: selectedPeople,
          groupName,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      handleClose()
      const res = await response.json()
      if (res.message === 'Success') {
        addGroup()
        setSelectedPeople([])
      }
    }
  }

  const handleClickImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div>
      <Button
        onClick={handleOpen}
        variant="contained"
        sx={{ marginRight: '5px', textTransform: 'none' }}>
        New Group Chat
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description">
        <Box
          sx={modalStyle}
          component="form"
          noValidate
          autoComplete="off"
          className={cn({
            newgroupchatmodal: mode === 'dark',
          })}>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', marginBottom: '15px' }}>
            New Group Chat
          </Typography>
          <Stack
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
            <Image
              src={selectedImage ? selectedImage : `/images/group.png`}
              alt="groupAvatar"
              width={100}
              height={100}
              onClick={handleClickImage}
              style={{ cursor: 'pointer' }}
            />
            <input
              accept="image/*"
              id="icon-button-file"
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </Stack>
          <TextField
            fullWidth
            id="outlined"
            label="Group Name"
            variant="outlined"
            onChange={(e) => {
              setGroupName(e.target.value)
            }}
            sx={{ marginBottom: '12px' }}
          />
          <Autocomplete
            multiple
            id="tags-outlined"
            options={users}
            getOptionLabel={(user) => `${user?.nickname} (${user?.email})`}
            value={selectedPeople}
            filterSelectedOptions
            onChange={handleAddPeople}
            renderInput={(params) => (
              <TextField {...params} label="Add People" />
            )}
            sx={{ marginBottom: '12px' }}
          />

          <Button
            onClick={newGroupChat}
            disabled={!groupName ? true : false}
            variant="contained"
            color="secondary"
            className={cn({
              doneBTN: mode === 'dark',
            })}>
            Done
          </Button>
          <Close
            onClick={handleClose}
            style={{
              position: 'absolute',
              cursor: 'pointer',
              top: '10px',
              right: '10px',
              color: 'white',
              fontSize: '32px',
            }}
          />
        </Box>
      </Modal>
    </div>
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
