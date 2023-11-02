import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemButton,
  TextField,
  Tabs,
  Tab,
  Typography,
  ListItem,
  ListItemText,
} from '@mui/material'
import CommentIcon from '@mui/icons-material/Comment'
import List from '@mui/material/List'
import { Stack } from '@mui/system'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Search as SearchIcon } from '@mui/icons-material'
import { language } from '../../jotai'
import languagejson from 'language.json'
import { useAtom } from 'jotai'
import { BulkResult } from 'mongodb'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

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
}
interface Result {
  author: string | null
  created_at: string | null
  need_id: string | null
  poster: string | null
  _id: string | null
}
const ProjectPage = () => {
  dayjs.extend(advancedFormat)
  const router = useRouter()
  const projectId = router.query.id
  const [lang, setLanguage] = useAtom(language)
  const [projectLists, setProjectLists] = useState<ListObject>({
    _id: null,
    author: null,
    title: null,
    startLine: null,
    deadLine: null,
    price: null,
    description: null,
    payType: null,
    file: null,
    where: null,
    exist: null,
    created_at: null,
    payUnit: null,
    role: null,
  })
  const [results, setResults] = useState<Result[]>([])
  const startChatting = (list: Result) => {
    router.push(`/chat?email=${list.author}`)
  }
  const getLists = async () => {
    const response = await fetch('/api/can/getProjectInfo', {
      method: 'POST',
      body: JSON.stringify({
        need_id: projectId,
      }),
    })
    const data = await response.json()
    console.log(data)
    setProjectLists(data.project)
    setResults(data.results)
  }
  useEffect(() => {
    getLists()
  }, [])

  return (
    <FullLayout title="projects/id" appbar={false}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          width: '100vw',
          alignItems: 'center',
        }}>
        <Typography sx={{ flexGrow: 1 }} variant="h4">
          {projectLists.title}
        </Typography>
        <IconButton size="large" edge="end" onClick={router.back}>
          <Image src="/images/back.png" alt="back" width={32} height={32} />
        </IconButton>
      </Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {results.map((list: Result) => (
          <ListItem
            key={list._id}
            disableGutters
            secondaryAction={
              <IconButton
                aria-label="comment"
                onClick={(e) => {
                  e.stopPropagation()
                  startChatting(list)
                }}>
                <CommentIcon />
              </IconButton>
            }
            sx={{
              paddingLeft: '8px',
              borderBottom: '1px solid',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              //   handleClickOpen(list)
            }}>
            <Stack sx={{ flexGrow: 1 }}>
              <Typography variant="h5">{list.author}</Typography>
              <Typography variant="h6">{
                dayjs(list.created_at).format('MM/DD/YYYY')
              }</Typography>
            </Stack>
          </ListItem>
        ))}
      </Box>
    </FullLayout>
  )
}

export default ProjectPage
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
