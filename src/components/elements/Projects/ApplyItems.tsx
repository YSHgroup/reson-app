import React, { useState } from 'react'
import { Comment } from '@mui/icons-material'
import {
  Badge,
  Divider,
  IconButton,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material'
import Image from 'next/image'
import Link from 'next/link'
import dayjs from 'dayjs'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { useRouter } from 'next/router'

interface ListObject {
  _id: string | null
  author: string | null
  title: string | null
  startLine: string | null
  deadLine: string | null
  price: number | null
  description: string | null
  payType: string | null
  file: string | null
  where: string | null
  exist: number | null
  created_at: string | null
  payUnit: string | null
  role: string | null
  count: number | null
}
interface ApplyObject {
  author: string | null
  created_at: string | null
  need_id: ListObject | null
  poster: string | null
  _id: string | null
  status: string
}
const ApplyItems = ({ lists }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ListObject>({
    _id: '',
    author: '',
    title: '',
    startLine: '',
    deadLine: '',
    price: null,
    description: '',
    payType: '',
    file: '',
    where: '',
    exist: null,
    created_at: '',
    payUnit: '',
    role: '',
    count: null,
  })

  const startChatting = (list: ApplyObject) => {
    router.push(`/chat?email=${list.poster}`)
  }
  const handleShowDetail = (detailInfo: ListObject) => {
    setDetail(detailInfo)
    setOpen(true)
  }
  const handleDetailClose = () => {
    setOpen(false)
    setDetail({
      _id: '',
      author: '',
      title: '',
      startLine: '',
      deadLine: '',
      price: null,
      description: '',
      payType: '',
      file: '',
      where: '',
      exist: null,
      created_at: '',
      payUnit: '',
      role: '',
      count: null,
    })
  }
  return (
    <>
      <List
        sx={{
          width: '100vw',
        }}>
        {lists.map((list: ApplyObject, i: number) => (
          <div key={list._id}>
            <ListItemButton
              key={list._id}
              onClick={(e) => {
                e.preventDefault();
                handleShowDetail(list.need_id);
              }}
            >
              <Stack sx={{ flexGrow: 1 }}>
                <Typography variant="h5">{list.need_id.title}</Typography>
                <Typography variant="h6">{list.poster}</Typography>
              </Stack>
              <span
                aria-label='comment'
              >
                {list.status}
              </span>
              {list.status === 'accepted' && (
                <IconButton
                  aria-label="comment"
                  onClick={(e) => {
                    e.stopPropagation()
                    startChatting(list)
                  }}>
                  <Comment />
                </IconButton>
              )}
            </ListItemButton>
            <Divider />
          </div>
        ))}

      </List>
      <Dialog
        open={open}
        onClose={handleDetailClose}
        style={{
          width: '100%',
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{detail.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {detail.price}
            {detail.payUnit} Per {detail.payType}
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            {detail.startLine && `StartLine: ${dayjs(detail.startLine).format("DD/MM/YYYY")}`} -{' '}
            {detail.deadLine && `DeadLine: ${dayjs(detail.deadLine).format("DD/MM/YYYY")}`}
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            Description:
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            {detail.description}
          </DialogContentText>
          {
            detail.file && (
              <a href={`api/view?name=needFiles/${detail.file}`} download style={{
                textDecorationLine: 'underline',
                textAlign: 'center'
              }}>Download files</a>
            )
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailClose} color="error">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
export default ApplyItems
