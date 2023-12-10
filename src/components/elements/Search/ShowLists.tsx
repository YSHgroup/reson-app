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
import { Star } from '@mui/icons-material'
import { useAtom } from 'jotai'
import { favorIdAtom } from 'atoms'

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
  const [applyPrice, setApplyPrice] = React.useState('')
  const [favorIds] = useAtom(favorIdAtom)
  const [favoridList, setFavorIdList] = React.useState([])
  console.table(favorIds)
  // console.log('favorites-- ids:',favorIds, props.lists.filter(list => favorIds.map(id => list._id.includes(id))))
  const startChatting = (item: ListObject) => {
    router.push(`/chat?email=${item.author}`)
  }

  const handleChangeApplyDesc = (e: any) => {
    setApplyDesc(e.target.value)
  }

  const handleApply = async (list: ListObject) => {
    if (applyDesc === '' || applyPrice === '') {
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
          price: applyPrice,
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
  const showFavorLists = async () => {
    const response = await fetch('/api/favorite/get-favorites', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    const result = await response.json()
    console.log('resutl --', result)
  }
  const favorOperation = async (item: any) => {
    // const queryString = new URLSearchParams({id: item._id}).toString()
    // const urlWithParams = `/api/favorite/add-favor?${queryString}`
    let isFavor = !!!favorIds.map(favor => Object.values(favor).includes(item._id)).every(arg => arg === false )
    const response = await fetch(!isFavor?'/api/favorite/add': '/api/favorite/remove', {
      method: 'POST',
      body: JSON.stringify({ id: item._id }),
      headers: { 'Content-Type': 'application/json' },
    })
    if(response.status !== 200 || !response.ok) {
      setSnack(
        new Snack({
          message: 'Failed to add',
          color: 'error',
          open: true,
        })
      )
      return
    }
    const result = await response.json()
    if(result.message) {
      setSnack(
        new Snack({
          message: result.message,
          color: 'success',
          open: true,
        })
      )
      // console.log('show list props-->', props.requestServer, props)
      props.requestServer()
    } else {
      console.log('error----->', result)
    }
  }
  const getStarColor = (id: string) => {
    //Evaluate if the entered id is the favorite id, return a color
    if (favoridList !== undefined) {
      const color = !!!favoridList
        .map((item) => Object.values(item).includes(id))
        .every((arg) => arg === false)
        ? 'gold'
        : 'secondary'
      return { color }
    } else {
      return { color: 'secondary' }
    }
  }
  React.useEffect(() => {
    showFavorLists()
    setFavorIdList(favorIds)
  }, [favorIds])
 
  return (
    <>
      <List sx={{ width: '100%', bgcolor: 'primary' }}>
        {props.lists === undefined ? (
          <ListItem
            disableGutters
            sx={{
              paddingLeft: '8px',
              textAlign: 'center',
              cursor: 'pointer',
            }}>
            <ListItemText secondary={'No Favorites'} />
          </ListItem>
        ) : props.lists.length === 0 ? (
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
          props.lists.map((item: ListObject) => (
            <ListItem
              key={item._id}
              disableGutters
              secondaryAction={
                <>
                  <IconButton onClick={() => favorOperation(item)}>
                    <Star sx={getStarColor(item._id)} />
                  </IconButton>
                  <IconButton
                    aria-label="comment"
                    onClick={(e) => {
                      e.stopPropagation()
                      startChatting(item)
                    }}>
                    <CommentIcon />
                  </IconButton>
                </>
              }
              sx={{
                paddingLeft: '8px',
                borderBottom: '1px solid',
                cursor: 'pointer',
              }}>
              <div
                style={{ width: '100%' }}
                onClick={(e) => {
                  handleClickOpen(item)
                }}>
                <ListItemText secondary={item.title} />
              </div>
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
            {selectList.startLine &&
              `StartLine: ${dayjs(selectList.startLine).format(
                'DD/MM/YYYY'
              )}`}{' '}
            -{' '}
            {selectList.deadLine &&
              `DeadLine: ${dayjs(selectList.deadLine).format('DD/MM/YYYY')}`}
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
          {selectList.file && (
            <a
              href={`api/view?name=needFiles/${selectList.file}`}
              download
              style={{
                textDecorationLine: 'underline',
                textAlign: 'center',
              }}>
              Download files
            </a>
          )}
          <Divider sx={{ marginTop: '12px' }} />
          <TextField
            id="outlined-multiline-static"
            label="Your Application"
            multiline
            rows={6}
            placeholder={
              "Example: Hi there! I'd like to apply for this Job as I feel I am fully qualified for the position. Are you able to provide me with more details?"
            }
            onChange={handleChangeApplyDesc}
            size="small"
            sx={{
              width: '100%',
              marginTop: '12px',
            }}
          />
          <TextField
            id="outlined-static"
            value={applyPrice}
            sx={{
              width: '100%',
              marginTop: '12px',
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
