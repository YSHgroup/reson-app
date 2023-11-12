import * as React from 'react'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import CommentIcon from '@mui/icons-material/Comment'
import IconButton from '@mui/material/IconButton'
import { useRouter } from 'next/router'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { Divider, Link, TextField } from '@mui/material'
import dayjs from 'dayjs'
import SnackbarContext, { Snack } from 'context/SnackbarContext'

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
export default function GutterlessList(props: any) {
  const router = useRouter()
  const { setSnack } = React.useContext(SnackbarContext)
  const [selectList, setSelectList] = React.useState<ListObject>({
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
  const [open, setOpen] = React.useState(false)
  const [applyDesc, setApplyDesc] = React.useState('')
  const [applyPrice, setApplyPrice] = React.useState('');
  const startChatting = (list: ListObject) => {
    router.push(`/chat?email=${list.author}`)
  }

  const handleChangeApplyDesc = (e: any) => {
    setApplyDesc(e.target.value)
  }

  const handleApply = async (list: ListObject) => {
    if (applyDesc === "" || applyPrice === "") {
      setSnack(
        new Snack({
          message: 'Enter your application and price',
          color: 'error',
          open: true,
        })
      )
    } else {
      const response = await fetch('/api/can/apply', {
        method: 'POST',
        body: JSON.stringify({
          need_id: list._id,
          poster: list.author,
          desc: applyDesc,
          price: applyPrice
        }),
      })
      const results = await response.json()
      if (results.message) {
        if (results.message === 'Success') {
          setSnack(
            new Snack({
              message: 'Successful Apply',
              color: 'success',
              open: true,
            })
          )
        } else {
          setSnack(
            new Snack({
              message: 'Already applied',
              color: 'error',
              open: true,
            })
          )
        }
        setOpen(false)
        setSelectList({
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
        setApplyDesc('')
        setApplyPrice(null)
      }
    }
  }

  const handleClickOpen = (list: ListObject) => {
    const startLineString = new Date(list.startLine)
    const startLine = startLineString.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    const deadLineString = new Date(list.deadLine)
    const deadLine = deadLineString.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    Object.assign(list, {
      startLine: startLine,
      deadLine: deadLine,
    })
    setSelectList(list)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectList({
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
  }
  return (
    <>
      <List sx={{ width: '100%', bgcolor: 'primary' }}>
        {props.lists.length === 0 ? (
          <ListItem
            disableGutters
            sx={{
              paddingLeft: '8px',
              textAlign: 'center',
              cursor: 'pointer',
            }}>
            <ListItemText secondary={'No result'} />
          </ListItem>
        ) : (
          props.lists.map((list: ListObject) => (
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
                handleClickOpen(list)
              }}>
              <ListItemText secondary={list.title} />
            </ListItem>
          ))
        )}
      </List>
      <Dialog
        open={open}
        onClose={handleClose}
        style={{
          width: '100%',
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">{selectList.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {selectList.price}
            {selectList.payUnit} Per {selectList.payType}
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            {selectList.startLine && `StartLine: ${dayjs(selectList.startLine).format("DD/MM/YYYY")}`} -{' '}
            {selectList.deadLine && `DeadLine: ${dayjs(selectList.deadLine).format("DD/MM/YYYY")}`}
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            Description:
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            {selectList.description}
          </DialogContentText>
          <DialogContentText id="alert-dialog-description">
            {selectList.where ? selectList.where : ''}
          </DialogContentText>
          {
            selectList.file && (
              <a href={`api/view?name=needFiles/${selectList.file}`} download style={{
                textDecorationLine: 'underline',
                textAlign: 'center'
              }}>Download files</a>
            )
          }
          <Divider sx={{ marginTop: '12px' }} />
          <TextField
            id="outlined-multiline-static"
            label="Your Application"
            multiline
            rows={6}
            placeholder={"Example: Hi there! I'd like to apply for this Job as I feel I am fully qualified for the position. Are you able to provide me with more details?"}
            onChange={handleChangeApplyDesc}
            size='small'
            sx={{
              width: "100%",
              marginTop: "12px"
            }}
          />
          <TextField
            id="outlined-static"
            value={applyPrice}
            sx={{
              width: '100%',
              marginTop: "12px"
            }}
            name="price"
            label="Price"
            placeholder="Your price"
            onChange={(e) => setApplyPrice(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error">
            Close
          </Button>
          <Button onClick={() => startChatting(selectList)} color="success">
            Chatting
          </Button>
          <Button onClick={() => handleApply(selectList)}>Apply</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
