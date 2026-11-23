import React, { useRef, useState } from 'react'
import {
  Divider,
  ListSubheader,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Alert,
  FormHelperText,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { Stack } from '@mui/material'
import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const bgColorLists = [
  {
    value: 'rgb(124, 179, 66)',
    label: 'Green',
  },
  {
    value: 'rgb(213, 0, 0)',
    label: 'Red',
  },
  {
    value: 'rgb(246, 191, 38)',
    label: 'Yellow',
  },
  {
    value: 'rgb(3, 155, 229)',
    label: 'Blue',
  },
  {
    value: 'rgb(142, 36, 170)',
    label: 'Pink',
  },
]
const CalendarModal = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2),
      minWidth: '50%',
    },
    '& .MuiDialogActions-root': {
      padding: theme.spacing(1),
    },
  }))

  const handleClickOpen = () => {
    setModalOpen(true)
  }
  const handleClose = () => {
    setModalOpen(false)
  }
  const [title, setTitle] = useState('')

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  return (
    <BootstrapDialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={true}>
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          color: 'whitesmoke',
        }}
        id="customized-dialog-title">
        Modal title
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}>
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Box
          sx={{
            '& .MuiTextField-root': { m: 1 },
          }}
          component="form"
          noValidate
          autoComplete="false">
          <TextField
            fullWidth
            label="Title"
            name="title"
            onChange={handleTextFieldChange}
            value={title}
          />
          <TextField fullWidth label="Start Time" type="datetime" />
          <TextField fullWidth label="End Time" />
          <TextField
            select
            fullWidth
            label="bgColor"
            helperText="Please select bgColor"
            defaultValue="rgb(124, 179, 66)">
            {bgColorLists.map((bgColorList) => (
              <MenuItem key={bgColorList.value} value={bgColorList.value}>
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: bgColorList.value,
                    marginRight: '10px',
                  }}
                />
                <span>{bgColorList.label}</span>
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            defaultValue=""
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button type={'submit'}>Save changes</Button>
      </DialogActions>
    </BootstrapDialog>
  )
}
