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
  price: number | string | null
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
  width: '100%',
  padding: '3px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.text.primary,
  fontSize: '1.2rem',
  borderRadius: '3px',
}))
const TextItem = styled(ListItem)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}))

const textForlan = {
  uploadFile: ['Upload File', 'Datei hochladen', 'Файл загрузки', 'Завантажити файл'],
  startLine: ['Start Line', 'Startlinie', 'Стартовая линия', 'Стартова лінія'],
  deadline: ['Deadline', 'Frist', 'Крайний срок', 'Кінцевий термін'],
  perPrice: {
    tag: ['Per Price', 'Pro Preis', 'За цену', 'За ціною'],
    list: {
      perPiece: ['Per Piece', 'Pro Stück', 'За штуку', 'За штуку'],
      perHour: ['Per Hour', 'Pro Stunde', 'За час', 'За годину'],
      perMonth: ['Per Month', 'Pro Monat', 'За месяц', 'За місяць'],
      perYear: ['Per Year', 'Pro Jahr', 'За год', 'За рік'],
      perUnit: ['Per Unit', 'Pro Einheit', 'За единицу', 'За одиницю'],
      forFree: ['For Free', 'Kostenlos', 'Бесплатно', 'Безкоштовно']
    }
  },
  role: {
    tag: ['Role', 'Rolle', 'Роль', 'Роль'],
    list: {
      AllRole: ['All Role', 'Alle Rollen', 'Все роли', 'Усі ролі'],
      Onsite: ['Onsite', 'Vor Ort', 'На месте', 'На сайті'],
      Hybrid: ['Hybrid', 'Hybrid', 'Гибридный', 'Гібрид'],
      Remote: ['Remote', 'Fernbedienung', 'Удаленный', 'Дистанційний'],
    },
  },
  description: ['Description', 'Beschreibung', 'Описание', 'Опис'],
  publish: ['Publish', 'Veröffentlichen', 'Опубликовать', 'Опублікувати']
};

export default function Need({ titlePattern, desPattern }) {
  const [lang, setLanguage] = useAtom(language)
  const { setSnack } = useContext(SnackbarContext)
  const [ip, setIp] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [need, setNeed] = useState<NeedFormType>({
    title: '',
    startLine: null,
    deadLine: null,
    price: '',
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
  const titleRef = useRef(null),
    desRef = useRef(null)

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
    if (role === 'title') {
      setNeed((pre) => ({
        ...pre,
        title: need.title
          .slice(0, need.title.lastIndexOf(' ') + 1)
          .concat(text),
      }))
    } else if (role === 'description') {
      setNeed((pre) => ({
        ...pre,
        description: need.description
          .slice(0, need.description.lastIndexOf(' ') + 1)
          .concat(text),
      }))
    }
    setIsPut(true)
    setPredictionWords([])
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
      setPredictionWords([])
    }
  }
  const handleKeyDownDes: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Tab' && !!predictionDesWords.length) {
      setNeed((pre) => ({
        ...pre,
        description: need.description
          .slice(0, need.description.lastIndexOf(' ') + 1)
          .concat(predictionDesWords[0]),
      }))
      setIsPut(true)
      setPredictionWords([])
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

  useEffect(() => {
    if (titleRef.current) {
      const titleInput = titleRef.current.children[1].children[1]
      titleInput.focus()
    }
  }, [predictionWords])

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

  useEffect(() => {
    if (desRef.current) {
      const desInput = desRef.current.children[1].children[0]
      desInput.focus()
    }
  }, [predictionDesWords])

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
                  ref={titleRef}
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
                    label={textForlan.startLine[lang]}
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
                    label={textForlan.deadline[lang]}
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
                      {textForlan.perPrice.tag[lang]}
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
                      <MenuItem value={'piece'}>{textForlan.perPrice.list.perPiece[lang]}</MenuItem>
                      <MenuItem value={'hour'}>{textForlan.perPrice.list.perHour[lang]}</MenuItem>
                      <MenuItem value={'month'}>{textForlan.perPrice.list.perMonth[lang]}</MenuItem>
                      <MenuItem value={'year'}>{textForlan.perPrice.list.perYear[lang]}</MenuItem>
                      <MenuItem value={'unit'}>{textForlan.perPrice.list.perUnit[lang]}</MenuItem>
                      <MenuItem value={'free'}>{textForlan.perPrice.list.forFree[lang]}</MenuItem>
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
                      {['Pay Unit', 'Lohneinheit', 'Единица оплаты', 'Платна одиниця'][lang]}
                    </InputLabel>
                    <Select
                      value={need.payUnit}
                      onChange={handleChangeNeedForm}
                      id="payment-select"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label={['Pay Unit', 'Lohneinheit', 'Единица оплаты', 'Платна одиниця'][lang]}
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
                    <InputLabel id="per-price-select-label">{textForlan.role.tag[lang]}</InputLabel>
                    <Select
                      value={need.role}
                      onChange={handleChangeNeedForm}
                      id="work-select"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Role"
                      labelId="role-select-label"
                      name="role">
                      <MenuItem value={'onsite'}>{textForlan.role.list.Onsite[lang]}</MenuItem>
                      <MenuItem value={'hybrid'}>{textForlan.role.list.Hybrid[lang]}</MenuItem>
                      <MenuItem value={'remote'}>{textForlan.role.list.Remote[lang]}</MenuItem>
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
                  sx={{
                    display: !predictionDesWords.length ? 'none' : 'block',
                  }}>
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
                label={['Where?', 'Wo?', 'Где?', 'Де?'][lang]}
                where={where}
                setWhere={(value: PlaceType) => setWhere(value)}
              />
              <div className="maps">
                <div id="map" style={{ height: '300px', overflow: 'hidden' }} />
              </div>

              <div className="actions">
                <Button variant="contained" onClick={submitPublish}>
                  {textForlan.publish[lang]}
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
