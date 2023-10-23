import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Close, Logout } from '@mui/icons-material'
import Autocomplete from '@mui/material/Autocomplete'
import {
  Button,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Modal,
  ListItemButton,
} from '@mui/material'
import Box from '@mui/material/Box'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import cn from 'classnames'
import ColorModeContext from 'context/ColorModeContext'

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
  
export default function FormModal({ users, groupInfo, members, setChangeState }: any) {
    const [open, setOpen] = React.useState(false)
  
    const handleOpen = () => {
      initMembers()
      setOpen(true)
    }
    const handleClose = () => {
      initMembers()
      setOpen(false)
    }
    const { mode, toggleColorMode } = React.useContext(ColorModeContext)
    const [groupName, setGroupName] = React.useState(groupInfo?.title)
    const { data: session } = useSession()
    const router = useRouter()
    const [selectedPeople, setSelectedPeople] = React.useState([])
    const [selectedImage, setSelectedImage] = React.useState<string | undefined>(
      undefined
    )
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = React.useState<File | undefined>(undefined)
    const handleAddPeople = (event: any, value: any) => {
      setSelectedPeople(value)
    }
  
    useEffect(() => {
      setGroupName(groupInfo?.title)
      initMembers()
    }, [groupInfo])
  
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
  
    const initMembers = () => {
      const people = users.filter((user: any) =>
        members.some((member: any) => member.email === user.email)
      )
      setSelectedPeople(people)
    }
  
    const updateGroup = async () => {
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
            groupInfo,
            groupName,
          })
        )
  
        const response = await fetch('/api/message/updateWithGroupAvatar', {
          method: 'POST',
          body: formData,
        })
        const res = await response.json()
        if (res.message === 'Success') {
          handleClose()
          setSelectedImage(undefined)
          setFile(undefined)
          setChangeState()
        }
      } else {
        const response = await fetch('/api/message/updateGroup', {
          method: 'POST',
          body: JSON.stringify({
            people: selectedPeople,
            groupInfo,
            groupName,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
        handleClose()
        const res = await response.json()
        if (res.message === 'Success') {
          setChangeState()
        }
      }
    }
  
    const leaveGroup = async () => {
      const response = await fetch('/api/message/leaveGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupInfo,
        }),
      })
      // handleClose();
      const res = await response.json()
      if (res.message === 'Success') {
        router.replace('/messages?group=1')
      }
    }
  
    const deleteGroup = async () => {
      const response = await fetch('/api/message/deleteGroup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupInfo,
        }),
      })
      // handleClose();
      const res = await response.json()
      if (res.message === 'Success') {
        router.replace('/messages?group=1')
      }
    }
  
    return (
      <div>
        <Image
          onClick={handleOpen}
          src={
            groupInfo !== null
              ? groupInfo.groupAvatar
                ? `/api/view?name=chats/${groupInfo.groupAvatar}`
                : `/images/group.png`
              : `/images/group.png`
          }
          alt={groupInfo !== null ? groupInfo.title : 'group'}
          width={70}
          height={70}
          style={{ cursor: 'pointer', padding: '5px' }}
        />
        {/* <Button onClick={handleOpen} variant="contained" sx={{marginRight: '5px', textTransform: 'none'}}>New Group Chat</Button> */}
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
            {session?.user?.email === groupInfo?.owner ? (
              <Typography
                variant="h6"
                sx={{ textAlign: 'center', marginBottom: '15px' }}>
                Group Settings
              </Typography>
            ) : (
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                {groupInfo?.title}
              </Typography>
            )}
            {session?.user?.email === groupInfo?.owner ? (
              <Stack
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                <Image
                  src={
                    selectedImage
                      ? selectedImage
                      : groupInfo !== null
                      ? groupInfo.groupAvatar
                        ? `/api/view?name=chats/${groupInfo.groupAvatar}`
                        : `/images/group.png`
                      : `/images/group.png`
                  }
                  alt={groupInfo?.title}
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
            ) : (
              <Stack
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                <Image
                  src={
                    groupInfo !== null
                      ? groupInfo.groupAvatar
                        ? `/api/view?name=chats/${groupInfo.groupAvatar}`
                        : `/images/group.png`
                      : `/images/group.png`
                  }
                  alt={groupInfo?.title}
                  width={100}
                  height={100}
                  onClick={handleClickImage}
                  style={{ cursor: 'pointer' }}
                />
              </Stack>
            )}
            {session?.user?.email === groupInfo?.owner && (
              <TextField
                fullWidth
                id="outlined"
                label="Group Name"
                variant="outlined"
                autoFocus={true}
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value)
                }}
                style={{ marginBottom: '12px' }}
              />
            )}
            {session?.user?.email !== groupInfo?.owner && (
              <Typography sx={{ marginTop: '20px', textDecoration: 'underline' }}>
                Members
              </Typography>
            )}
  
            {session?.user?.email === groupInfo?.owner ? (
              <Autocomplete
                multiple
                id="tags-outlined"
                options={users}
                getOptionLabel={(user) => `${user?.nickname} (${user?.email})`}
                value={selectedPeople}
                onChange={handleAddPeople}
                renderInput={(params) => (
                  <TextField {...params} label="Add People" />
                )}
                sx={{ marginBottom: '12px' }}
              />
            ) : (
              <List
                dense
                component="div"
                role="list"
                sx={{
                  maxHeight: '450px',
                  overflow: 'auto',
                }}>
                {members.map((member: any, i: number) => {
                  const labelId = `transfer-list-item-${member.email}-label`
                  return (
                    <ListItem disablePadding key={i}>
                      <ListItemButton>
                        <ListItemText
                          primary={`${member.nickname} (${member.email})`}
                        />
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="center"
              spacing={{ xs: 1, sm: 2, md: 4 }}>
              {session?.user?.email === groupInfo?.owner ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={deleteGroup}
                  startIcon={<Logout />}
                  className={cn({
                    doneBTN: mode === 'dark',
                  })}>
                  Delete this Group
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={leaveGroup}
                  startIcon={<Logout />}
                  className={cn({
                    doneBTN: mode === 'dark',
                  })}>
                  Leave
                </Button>
              )}
              {session?.user?.email === groupInfo?.owner &&
                (!groupName ? (
                  <Button
                    disabled
                    variant="contained"
                    color="secondary"
                    onClick={updateGroup}
                    className={cn({
                      doneBTN: mode === 'dark',
                    })}>
                    Done
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={updateGroup}
                    className={cn({
                      doneBTN: mode === 'dark',
                    })}>
                    Done
                  </Button>
                ))}
            </Stack>
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