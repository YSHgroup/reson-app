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
import { useRouter } from 'next/router'
import React from 'react'

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

  const startChatting = (list: ApplyObject) => {
    router.push(`/chat?email=${list.poster}`)
  }
  return (
    <List
      sx={{
        width: '100vw',
      }}>
      {lists.map((list: ApplyObject, i: number) => (
        <div key={list._id}>
          <ListItemButton
            key={list._id}
          // secondaryAction={

          // }>
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
  )
}
export default ApplyItems
