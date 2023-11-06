import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  Box,
  IconButton,
  Typography,
  ListItem,
} from '@mui/material'
import CommentIcon from '@mui/icons-material/Comment'
import PersonIcon from '@mui/icons-material/Person'
import { Stack } from '@mui/system'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { language } from '../../jotai'
import { useAtom } from 'jotai'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
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
  description: string | null
  _id: string | null
}
const ProjectPage = () => {
  dayjs.extend(advancedFormat)
  const router = useRouter()
  const projectId = router.query.id
  const [lang, setLanguage] = useAtom(language)
  const [open, setOpen] = React.useState(false)
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
  const [selectedResult, setSelectedResult] = useState<Result>({
    author: "",
    created_at: "",
    need_id: "",
    poster: "",
    description: "",
    _id: "",
  })
  const startChatting = (list: Result) => {
    router.push(`/chat?email=${list.author}`)
  }
  const handleShowDescription = (list: Result) => {
    setSelectedResult(list)
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
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

  const handleClickOpen = (author: string) => {
    router.replace(`/profiles/${author}`)
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
              <>
                <IconButton
                  aria-label="comment"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    startChatting(list)
                  }}>
                  <CommentIcon />
                </IconButton>
                <IconButton
                  aria-label='person'
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClickOpen(list.author)
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </>
            }
            sx={{
              paddingLeft: '8px',
              borderBottom: '1px solid',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.preventDefault();
              handleShowDescription(list)
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
      <Dialog
        open={open}
        onClose={handleClose}
        style={{
          width: '100%',
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Description</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {!selectedResult.description ? "No description" : selectedResult.description}
          </DialogContentText>
          <DialogContentText
            sx={{
              textAlign: 'right',
              fontSize: '12px'
            }}
          >
            {selectedResult.author}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error">
            Close
          </Button>
        </DialogActions>
      </Dialog>
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
