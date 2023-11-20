import { useState, useContext } from 'react'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import Search from '@mui/icons-material/Search'
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { language } from '../../../jotai'
import languagejson from '../../../language.json'
import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  CalendarMonth as CalendarMonthIcon,
  CloudUpload as CloudUploadIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'
import 'react-swipeable-list/dist/styles.css'
import GoogleMaps from '@elements/Need/GoogleLocation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import FullLayout from '@layouts/FullLayout'

mapboxgl.accessToken =
  'pk.eyJ1IjoiYW50b25pb2dzdW55ZSIsImEiOiJjbGxub3g5em4wMnoxM2ZvYWNiZXA5dWUyIn0.cw7jmzNVcCy5vQq3iOGEZw'

interface NeedFormType {
  title: string | null
  startLine: Date | null
  deadLine: Date | null
  price: number | null
  payType: string
  description: string | null
  payUnit: string
  role: string
}
interface MainTextMatchedSubstrings {
  offset: number
  length: number
}
interface StructuredFormatting {
  main_text: string
  secondary_text: string
  main_text_matched_substrings?: readonly MainTextMatchedSubstrings[]
}
interface PlaceType {
  description: string
  structured_formatting: StructuredFormatting
}
export default function Need() {
  const [lang, setLanguage] = useAtom(language)
  const { setSnack } = useContext(SnackbarContext)
  const [ip, setIp] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [need, setNeed] = useState<NeedFormType>({
    title: '',
    startLine: null,
    deadLine: null,
    price: null,
    description: '',
    payType: 'piece',
    payUnit: 'usd',
    role: 'onsite',
  })
  const [dbWhere, setDbWhere] = useState<string | null>(null);
  const [where, setWhere] = useState<PlaceType | null>(null)
  const router = useRouter()
  const projectID = router.query.id;

  useEffect(() => {
    showMapBox()
  }, [where])

  useEffect(() => {
    getCountry()
    getProject();
  }, [])

  const getProject = async () => {
    const response = await fetch('/api/need/getProject', {
      method: 'POST',
      body: JSON.stringify({
        id: projectID
      }),
    })
    const data = await response.json()
    if (response.ok) {
      setNeed({
        title: data.title || '',
        startLine: data.startLine ? new Date(data.startLine) : null,
        deadLine: data.deadLine ? new Date(data.deadLine) : null,
        price: data.price || null,
        description: data.description || '',
        payType: data.payType || 'piece',
        payUnit: data.payUnit || 'usd',
        role: data.role || 'onsite',
      })
      setDbWhere(data.where || null)
      showMapBox(data.where)
    }
  }

  const getCountry = async () => {
    const response = await fetch(`https://ipapi.co/json`)
    const countryCode = await response.json()
    setIp(`${countryCode.city}, ${countryCode.country_name}`)
  }
  const showMapBox = async (country?: string) => {
    const select = where ? where.description : ip;
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${country || select}.json?access_token=${mapboxgl.accessToken}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.features.length > 0) {
          const { center } = data.features[0]
          const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: center,
            zoom: 6,
          })
          map.addControl(new mapboxgl.NavigationControl());
          new mapboxgl.Marker().setLngLat(center).addTo(map);
        }
      })
  }
  useEffect(() => {
    const elements = document.getElementsByClassName(
      'mapboxgl-control-container'
    )
    if (elements.length > 0) {
      elements[0].remove()
    }
  })

  const handleChangeUpload = (e: any) => {
    setFile(e.target.files[0])
  }

  const handleChangeNeedForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNeed((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  const UpdateDataAndFile = async () => {
    const formdata = new FormData()
    formdata.append('file', file)
    formdata.append(
      'fields',
      JSON.stringify({
        ...need,
        where: where ? where.structured_formatting.main_text : dbWhere,
        _id: projectID
      })
    )
    try {
      const response = await fetch('/api/need/update_file', {
        method: 'POST',
        body: formdata,
      })
      if (response.ok) {
        setSnack(
          new Snack({
            message: 'Successful ',
            color: 'success',
            open: true,
          })
        )
        setFile(null)
        setNeed({
          title: '',
          startLine: null,
          deadLine: null,
          price: null,
          description: '',
          payType: 'piece',
          payUnit: 'usd',
          role: 'onsite',
        })
        setWhere(null)
        setDbWhere(null)
        router.push(`/projects/${projectID}`)
      }
    } catch (err) {
      setSnack(
        new Snack({
          message: err,
          color: 'error',
          open: true,
        })
      )
    }
  }

  const UpdateData = async () => {
    const data = {
      ...need,
      where: where ? where.structured_formatting.main_text : dbWhere,
      _id: projectID
    }
    try {
      const response = await fetch('/api/need/update', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      if (response.ok) {
        setSnack(
          new Snack({
            message: 'Successful ',
            color: 'success',
            open: true,
          })
        )
        setNeed({
          title: '',
          startLine: null,
          deadLine: null,
          price: null,
          description: '',
          payType: 'piece',
          payUnit: 'usd',
          role: 'onsite',
        })
        setWhere(null)
        setDbWhere(null)
        router.push(`/projects/${projectID}`)
      }
    } catch (err) {
      setSnack(
        new Snack({
          message: err,
          color: 'error',
          open: true,
        })
      )
    }
  }

  const submitPublish = async () => {
    if (need.title === '' || need.description === '' || !need.price) {
      setSnack(
        new Snack({
          message: 'Title, Price and Description are required items.',
          color: 'error',
          open: true,
        })
      )
    } else if (file) {
      UpdateDataAndFile()
    } else {
      UpdateData()
    }
  }

  return (
    <FullLayout title={"UPDATE"}>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="page">
          <div className="create">
            <div className="main">
              <TextField
                sx={{
                  width: '100%',
                }}
                variant="outlined"
                name="title"
                label={languagejson[lang].WhatDoYouNeed}
                value={need.title}
                onChange={handleChangeNeedForm}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <div className="example">
                <Typography>{languagejson[lang].Showexample}:</Typography>
                <Typography>{file !== null && file.name}</Typography>
                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadIcon />}>
                  Upload File
                  <input
                    type="file"
                    style={{
                      clip: 'rect(0 0 0 0)',
                      clipPath: 'inset(50%)',
                      height: 1,
                      overflow: 'hidden',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      whiteSpace: 'nowrap',
                      width: 1,
                    }}
                    onChange={handleChangeUpload}
                  />
                </Button>
              </div>
              <div className="calendar">
                <Box>
                  <CalendarMonthIcon
                    sx={{
                      fontSize: 50,
                      marginRight: '20px',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                  <DatePicker
                    label="StartLine"
                    value={need.startLine}
                    onChange={(value) => {
                      setNeed((prevState) => ({
                        ...prevState,
                        startLine: value,
                      }))
                    }}
                    renderInput={(props) => (
                      <TextField sx={{ width: '45%' }} {...props} />
                    )}
                  />
                  <DatePicker
                    label="DeadLine"
                    value={need.deadLine}
                    onChange={(value) => {
                      setNeed((prevState) => ({
                        ...prevState,
                        deadLine: value,
                      }))
                    }}
                    renderInput={(props) => (
                      <TextField sx={{ width: '45%' }} {...props} />
                    )}
                  />
                </Box>
              </div>
              <div className="timer">
                <Box>
                  <PaymentIcon
                    sx={{
                      fontSize: 50,
                      marginRight: '20px',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                  <TextField
                    value={need.price}
                    sx={{
                      width: '45%',
                    }}
                    name="price"
                    label="Price"
                    type="number"
                    inputProps={{
                      min: 0,
                    }}
                    placeholder="Price"
                    onChange={handleChangeNeedForm}
                  />
                  <FormControl sx={{ width: '45%' }}>
                    <InputLabel id="per-price-select-label">Per Price</InputLabel>
                    <Select
                      value={need.payType}
                      onChange={handleChangeNeedForm}
                      id="outlined"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Per Price"
                      labelId="per-price-select-label"
                      name="payType">
                      <MenuItem value={'piece'}>per Piece</MenuItem>
                      <MenuItem value={'hour'}>per Hour</MenuItem>
                      <MenuItem value={'month'}>per Month</MenuItem>
                      <MenuItem value={'year'}>per Year</MenuItem>
                      <MenuItem value={'unit'}>per Unit</MenuItem>
                      <MenuItem value={'free'}>for Free</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </div>
              <div className="timer">
                <Box>
                  <PaymentIcon
                    sx={{
                      fontSize: 50,
                      marginRight: '20px',
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                  <FormControl sx={{ width: '45%' }}>
                    <InputLabel id="per-price-select-label">Pay Unit</InputLabel>
                    <Select
                      value={need.payUnit}
                      onChange={handleChangeNeedForm}
                      id="outlined"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Pay Unit"
                      labelId="pay-unit-select-label"
                      name="payUnit">
                      <MenuItem value={'usd'}>USD</MenuItem>
                      <MenuItem value={'uah'}>UAH</MenuItem>
                      <MenuItem value={'eur'}>EUR</MenuItem>
                      <MenuItem value={'gbp'}>GBP</MenuItem>
                      <MenuItem value={'cad'}>CAD</MenuItem>
                      <MenuItem value={'aud'}>AUD</MenuItem>
                      <MenuItem value={'cny'}>CNY</MenuItem>
                      <MenuItem value={'inr'}>INR</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl sx={{ width: '45%' }}>
                    <InputLabel id="per-price-select-label">Role</InputLabel>
                    <Select
                      value={need.role}
                      onChange={handleChangeNeedForm}
                      id="outlined"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Role"
                      labelId="role-select-label"
                      name="role">
                      <MenuItem value={'onsite'}>Onsite</MenuItem>
                      <MenuItem value={'hybrid'}>Hybrid</MenuItem>
                      <MenuItem value={'remote'}>Remote</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </div>

              <TextField
                value={need.description}
                onChange={handleChangeNeedForm}
                name="description"
                id="outlined-required"
                required
                multiline
                sx={{
                  width: '100%',
                  marginTop: '20px',
                }}
                rows={4}
                placeholder="Description..."
                label="Description"
              />
              <GoogleMaps
                where={where}
                setWhere={(value: PlaceType) => setWhere(value)}
              />
              <div className="maps">
                <div id="map" style={{ height: '300px', overflow: 'hidden' }} />
              </div>

              <div className="actions">
                <Button variant="contained" onClick={submitPublish}>
                  PUBLISH
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Box>
    </FullLayout>
  )
}

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
