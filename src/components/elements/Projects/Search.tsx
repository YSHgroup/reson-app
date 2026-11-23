import { useState, useContext, useMemo } from 'react'
import {
  Box,
  Button,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
} from '@mui/material'
import Search from '@mui/icons-material/Search'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { Payment as PaymentIcon } from '@mui/icons-material'
import GoogleMaps from '@elements/Need/GoogleLocation'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import mapboxgl from 'mapbox-gl'
import { language } from '../../../state'
import languagejson from '../../../language.json'
import ShowLists from 'components/elements/Search/ShowLists'
import 'react-swipeable-list/dist/styles.css'
import 'mapbox-gl/dist/mapbox-gl.css'


const minDistance = 5000
export default function SearchComponent({
  lists,
  onItemChange,
}: {
  lists: any[],
  onItemChange?: () => void
}) {
  const [lang] = useAtom(language)
  const { setSnack } = useContext(SnackbarContext)
  // const [lists, setLists] = useState([])

  // const getHistory = async () => {
  //     const response = await fetch('/api/search-history/get', {
  //       method: 'GET' })
  //     const {history} = await response.json()
  //     // console.log("get history results --> ", history.data.map(item => item.results).flat(2))
  //     return (history.data.map(item => item.results).flat(2))
  // }

  // // Use useMemo to store the previous data.
  // const historyData = useMemo(()=> {
  //   let data: any
  //   (async () => {
  //     data = await getHistory()
  //     setLists(data)
  //   })()

  //   return data
  // }, [])

  // useEffect(()=> {
  //   // Only call loadData if the data hasn't been loaded yet.
  //   if(!historyData) {
  //     (async ()=> {
  //       const data =await getHistory()
  //       setLists(data)
  //     })()
  //   }
  // }, [historyData])

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div className="page" style={{ height: 'auto', margin: '2rem auto' }}>
        <div className="search" style={{ margin: 'auto' }}>
          
          <div className="showlists">
            <ShowLists lists={lists} requestServer={onItemChange} />
          </div>
        </div>
      </div>
    </Box>
  )
}
