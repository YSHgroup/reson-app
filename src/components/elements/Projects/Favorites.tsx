import {
  Box,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'
import ShowList from 'components/elements/Search/ShowLists'

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

const ResponsiveLayout = styled('div')(({ theme }) => ({
  padding: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    padding: '5px',
  },
  [theme.breakpoints.up('sm')]: {
    padding: '2rem',
    maxWidth: '70%',
    margin: '0 auto'
  },
}))

const Favorites = ({ lists, onItemChange }) => {
  // const list = lists
  const [list, setList] = useState<ListObject[]>([])
  useEffect(() => {
    setList(lists)
  }, [lists])
  return (
    <Box
      sx={{
        width: '100%',
      }}>
      <ResponsiveLayout>
        <ShowList lists={list} requestServer = {onItemChange} />
      </ResponsiveLayout>
    </Box>
  )
}
export default Favorites
