import { useState, useContext, KeyboardEventHandler } from 'react'
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
  List,
  ListItem,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { language } from '../jotai'
import languagejson from '../language.json'
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
import { connectToDatabase } from '@lib/db'
import { analyseText } from 'functions/anaylseText'
import { useTheme } from '@emotion/react'

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

const WordsDropdown = styled('div')(({ theme }) => ({
  // position: 'absolute',
  width: '100%',
  padding: '3px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.text.primary,
  fontSize: '1.2rem',
  borderRadius: '3px',
}))
const TextItem = styled(ListItem)(({ theme }) => ({
  // padding: '3px 0',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}))

export default function Need({ titlePattern, desPattern }) {
  // console.log('server side props: ', titlePattern, desPattern)
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
  const [where, setWhere] = useState<PlaceType | null>(null)
  const [predictionWords, setPredictionWords] = useState<any[]>([])
  const [predictionDesWords, setPredictionDesWords] = useState<any[]>([])
  const [isPut, setIsPut] = useState(false)
  const theme = useTheme()
  const titleRef = useRef(null), desRef = useRef(null)

  useEffect(() => {
    showMapBox()
  }, [where])

  useEffect(() => {
    getCountry()
  }, [])
  const getCountry = async () => {
    const response = await fetch(`https://ipapi.co/json`)
    const countryCode = await response.json()
    showMapBox(`${countryCode.city}, ${countryCode.country_name}`)
    setIp(`${countryCode.city}, ${countryCode.country_name}`)
  }
  const showMapBox = async (country?: string) => {
    const select = where ? where.description : ip
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${
        country || select
      }.json?access_token=${mapboxgl.accessToken}`
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
          map.addControl(new mapboxgl.NavigationControl())
          new mapboxgl.Marker().setLngLat(center).addTo(map)
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

  const CreateDataAndFile = async () => {
    const formdata = new FormData()
    formdata.append('file', file)
    formdata.append(
      'fields',
      JSON.stringify({
        ...need,
        where: where ? where.structured_formatting.main_text : null,
      })
    )
    try {
      const response = await fetch('/api/need/create_file', {
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

  const CreateData = async () => {
    const data = {
      ...need,
      where: where ? where.structured_formatting.main_text : null,
    }
    try {
      const response = await fetch('/api/need/create', {
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

  const handlTextItemClick = (text: string, role: string) => {
    if(role === 'title'){
    setNeed((pre) => ({
      ...pre,
      title: need.title.slice(0, need.title.lastIndexOf(' ') + 1).concat(text),
    }))
    } else if(role === 'description') {
      setNeed((pre) => ({
        ...pre,
        description: need.description.slice(0, need.description.lastIndexOf(' ') + 1).concat(text),
      }))
    }
    setIsPut(true)
  }
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Tab' && !!predictionWords.length) {
      setNeed((pre) => ({
        ...pre,
        title: need.title
          .slice(0, need.title.lastIndexOf(' ') + 1)
          .concat(predictionWords[0]),
      }))
      setIsPut(true)
    }
  }
  const handleKeyDownDes: KeyboardEventHandler<HTMLDivElement> = (event) => {
    console.log(event.key, ' : des key pressed')
    if (event.key === 'Tab' && !!predictionDesWords.length) {
      setNeed((pre) => ({
        ...pre,
        description: need.description
          .slice(0, need.description.lastIndexOf(' ') + 1)
          .concat(predictionDesWords[0]),
      }))
      setIsPut(true)
    }
  }
  
  useEffect(() => {
    if (isPut) {
      setIsPut(false)
      setPredictionWords([])
    } else {
      let prediction: string[] = []
      let inputedWord = need.title.split(' ').slice(-1)[0]
      titlePattern.forEach(
        (string: string, i: number) =>
          !string
            .toLocaleLowerCase()
            .slice(0, inputedWord.length)
            .localeCompare(inputedWord.toLocaleLowerCase()) &&
          prediction.push(string)
      )
      setPredictionWords(!!inputedWord ? prediction.slice(0, 6) : [])
    }
    
  }, [need.title])

  useEffect(()=> {
    if(titleRef.current){
      const titleInput = titleRef.current.children[1].children[1]
      titleInput.focus()
    }
  },[predictionWords])

  useEffect(() => {
    if (isPut) {
      setIsPut(false)
      setPredictionDesWords([])
    } else {
      let prediction: string[] = []
      let inputedWord = need.description.split(' ').slice(-1)[0]
      desPattern.forEach(
        (string: string, i: number) =>
          !string
            .toLocaleLowerCase()
            .slice(0, inputedWord.length)
            .localeCompare(inputedWord.toLocaleLowerCase()) &&
          prediction.push(string)
      )
      setPredictionDesWords(!!inputedWord ? prediction.slice(0, 6) : [])
    }
  }, [need.description])

  useEffect(()=> {
    if(desRef.current){
      const desInput = desRef.current.children[1].children[0]
      desInput.focus()
    }
  },[predictionDesWords])
  
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
      CreateDataAndFile()
    } else {
      CreateData()
    }
    try {
      console.table(need)
      await fetch('/api/can/create-analysis', {
        method: 'POST',
        body: JSON.stringify({ need }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.log('create analysis error:', error)
    }
  }

  return (
    <FullLayout title={languagejson[lang].CAN}>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <div className="page">
          <div className="create" style={{ margin: 'auto' }}>
            <div className="main">
              <Box position="relative" width="inherit">
                <TextField
                  sx={{
                    width: '100%',
                  }}
                  ref = {titleRef}
                  variant="outlined"
                  name="title"
                  label={languagejson[lang].WhatDoYouNeed}
                  value={need.title}
                  onKeyDown={handleKeyDown}
                  onChange={handleChangeNeedForm}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <WordsDropdown
                  // theme={theme}
                  sx={{ display: !predictionWords.length ? 'none' : 'block' }}>
                  <List style={{ listStyle: 'none' }}>
                    {predictionWords.map((text, i) => (
                      <TextItem
                        role="presentation"
                        key={i}
                        onClick={() => handlTextItemClick(text, 'title')}>
                        {text}
                      </TextItem>
                    ))}
                  </List>
                </WordsDropdown>
              </Box>
              <div className="example">
                <Typography component={'span'} sx={{ color: 'text.primary' }}>
                  {languagejson[lang].Showexample}:
                </Typography>
                <Typography component={'span'} sx={{ color: 'text.secondary' }}>
                  {file !== null && file.name}
                </Typography>
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
                      color: 'text.secondary',
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
                      color: 'text.secondary',
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
                    <InputLabel id="per-price-select-label">
                      Per Price
                    </InputLabel>
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
                      color: 'text.secondary',
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
                    <InputLabel id="per-price-select-label">
                      Pay Unit
                    </InputLabel>
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
              <Box position={'relative'} width={'inherit'}>
                <TextField
                ref={desRef}
                  value={need.description}
                  onKeyDown={handleKeyDownDes}
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
                <WordsDropdown
                  // theme={theme}
                  sx={{ display: !predictionDesWords.length ? 'none' : 'block' }}>
                  <List style={{ listStyle: 'none' }}>
                    {predictionDesWords.map((text, i) => (
                      <TextItem
                        role="presentation"
                        key={i}
                        onClick={() => handlTextItemClick(text, 'description')}>
                        {text}
                      </TextItem>
                    ))}
                  </List>
                </WordsDropdown>
              </Box>
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

  try {
    const client = await connectToDatabase()
    const collection = client.db().collection('project_texts')

    const textData = await collection.findOne(
      { email: session.user.email },
      {
        projection: {
          email: 0,
          _id: 0,
          'title_texts.user_email': 0,
          'des_texts.user_email': 0,
        },
      }
    )
    const titlePattern = analyseText(textData['title_texts'])
    const desPattern = analyseText(textData['des_texts'])
    return {
      props: {
        session,
        titlePattern,
        desPattern,
      },
    }
  } catch (error) {
    console.error('create server error: ', error)
    return {
      props: {
        session,
        titlePattern: [],
        desPattern: [],
      },
    }
  }
}
