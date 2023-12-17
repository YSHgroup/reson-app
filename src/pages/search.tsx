import {
  useState,
  useContext,
  useEffect,
  KeyboardEventHandler,
  useRef,
} from 'react'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Search from '@mui/icons-material/Search'
import {
  Box,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Autocomplete,
  List,
  ListItem,
} from '@mui/material'
import { language } from '../jotai'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import mapboxgl from 'mapbox-gl'
import { Payment as PaymentIcon } from '@mui/icons-material'
import 'react-swipeable-list/dist/styles.css'
import GoogleMaps from '@elements/Need/GoogleLocation'
import 'mapbox-gl/dist/mapbox-gl.css'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import ShowLists from 'components/elements/Search/ShowLists'
import FullLayout from '@layouts/FullLayout'
import { favorIdAtom } from 'atoms'
import { connectToDatabase } from '@lib/db'
import { analyseText } from 'functions/anaylseText'
import { styled, useTheme } from '@mui/material/styles'

// eslint-disable-next-line import/no-webpack-loader-syntax
// mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

mapboxgl.accessToken =
  'pk.eyJ1IjoiYW50b25pb2dzdW55ZSIsImEiOiJjbGxub3g5em4wMnoxM2ZvYWNiZXA5dWUyIn0.cw7jmzNVcCy5vQq3iOGEZw'
interface CanFormType {
  title: string | null
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

const minDistance = 5000

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

export default function Can({ textPattern }) {
  console.log('get props textdata-->', textPattern)
  const parentRef = useRef(null)
  const [lang, setLanguage] = useAtom(language)
  const { setSnack } = useContext(SnackbarContext)
  const [ip, setIp] = useState<string | null>(null)
  const [lists, setLists] = useState([])
  const [sliderValue, setSliderValue] = useState<number[]>([0, 5000])
  const [favorIds, setFavorId] = useAtom(favorIdAtom)
  const [can, setCan] = useState<CanFormType>({
    title: '',
    payUnit: 'all',
    role: 'all',
  })
  const [where, setWhere] = useState<PlaceType | null>(null)
  const [predictionWords, setPredictionWords] = useState<any[]>([])
  const [isPut, setIsPut] = useState(false)

  const theme = useTheme()

  const handleSliderChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
      return
    }

    if (newValue[1] - newValue[0] < minDistance) {
      if (activeThumb === 0) {
        const clamped = Math.min(newValue[0], 100000 - minDistance)
        setSliderValue([clamped, clamped + minDistance])
      } else {
        const clamped = Math.max(newValue[1], minDistance)
        setSliderValue([clamped - minDistance, clamped])
      }
    } else {
      setSliderValue(newValue as number[])
    }
  }

  function valuetext(value: number) {
    return `${value} ${can.payUnit}`
  }
  const getFavorites = async () => {
    try {
      const response = await fetch('/api/favorite/get-favorites', {
        method: 'GET',
      })
      const personalFavor = await response.json()
      setFavorId(personalFavor.favorites)
    } catch (err) {
      console.log('Project/ error: ', err)
    }
  }

  useEffect(() => {
    showMapBox()
  }, [where])

  useEffect(() => {
    getCountry()
  }, [])
  const getCountry = async () => {
    const response = await fetch(`https://ipapi.co/json`)
    const countryCode = await response.json()
    setIp(`${countryCode.city}, ${countryCode.country_name}`)
    showMapBox(`${countryCode.city}, ${countryCode.country_name}`)
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

  const handleChangeCan = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCan((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }
  const submitPublish = async () => {
    if (can.title === '') {
      setSnack(
        new Snack({
          message: 'Title and description are required items.',
          color: 'error',
          open: true,
        })
      )
    }
  }

  const handleSearch = async () => {
    if (can.title !== '') {
      const response = await fetch('/api/can/getResults', {
        method: 'POST',
        body: JSON.stringify({
          payUnit: can.payUnit,
          role: can.role,
          title: can.title.trim(),
          min: sliderValue[0],
          max: sliderValue[1],
          where: where ? where.structured_formatting.main_text : null,
        }),
      })
      const results = await response.json()
      if (results.message === 'Success') {
        if (results.results.length === 0) {
          setSnack(
            new Snack({
              message: 'There are no results matching the conditions.',
              color: 'error',
              open: true,
            })
          )
        }
        setLists(results.results)
      }
    } else {
      setSnack(
        new Snack({
          message: 'Title is required items.',
          color: 'error',
          open: true,
        })
      )
    }
    try {
      await fetch('/api/need/search-analysis', {
        method: 'POST',
        body: JSON.stringify({ text: can.title }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.log('search analysis error:', error)
    }
  }
  const handlTextItemClick = (text: string) => {
    setCan((pre) => ({
      ...pre,
      title: can.title.slice(0, can.title.lastIndexOf(' ') + 1).concat(text),
    }))
    setIsPut(true)
  }
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === 'Tab' && !!predictionWords.length) {
      setCan((pre) => ({
        ...pre,
        title: can.title
          .slice(0, can.title.lastIndexOf(' ') + 1)
          .concat(predictionWords[0]),
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
      let inputedWord = can.title.split(' ').slice(-1)[0]
      textPattern.forEach(
        (string: string, i: number) =>
          !string
            .toLocaleLowerCase()
            .slice(0, inputedWord.length)
            .localeCompare(inputedWord.toLocaleLowerCase()) &&
          prediction.push(string)
      )
      // const objectArray = prediction.slice(0, 6).map((value, index)=> ({
      //   lable: index,
      //   value: value
      // }))

      setPredictionWords(!!inputedWord ? prediction.slice(0, 6) : [])
    }
  }, [can.title])
  if (parentRef.current) {
    const firstChildElement = parentRef.current.children[1].children[1]
    if (firstChildElement.tagName === 'INPUT') firstChildElement.focus()
  }

  console.log('word prediction: ', can.title)
  return (
    <FullLayout title={languagejson[lang].NEED}>
      {/* <Autocomplete
        // freeSolo
        options={predictionWords}
        renderOption={(props, option)=> (
          option.label
        )}
        // getOptionLabel={(option)=> option.label}
        renderInput={
          (params) => (
            <TextField {...params} label="Movie" />
          )
        } 
        ></Autocomplete> */}
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
        <div className="page">
          <div className="search" style={{ margin: 'auto' }}>
            <div className="main">
              <Box position="relative" width="inherit">
                <TextField
                  ref={parentRef}
                  sx={{
                    width: '100%',
                  }}
                  variant="outlined"
                  name="title"
                  label={languagejson[lang].whatYouAreLookingFor}
                  value={can.title}
                  onKeyDown={handleKeyDown}
                  onChange={handleChangeCan}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                <WordsDropdown
                  theme={theme}
                  sx={{ display: !predictionWords.length ? 'none' : 'block' }}>
                  <List style={{ listStyle: 'none' }}>
                    {predictionWords.map((text) => (
                      <TextItem
                        role="presentation"
                        onClick={() => handlTextItemClick(text)}>
                        {text}
                      </TextItem>
                    ))}
                  </List>
                </WordsDropdown>
              </Box>
              <div className="timer">
                <Box>
                  <PaymentIcon
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#fff'
                          : theme.palette.mode === 'light'
                          ? '#22222288'
                          : '#fff',
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
                  <Slider
                    getAriaLabel={() => 'Minimum distance shift'}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100000}
                    getAriaValueText={valuetext}
                    disableSwap
                  />
                </Box>
              </div>
              <div className="timer">
                <Box>
                  <PaymentIcon
                    sx={{
                      color: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '#fff'
                          : theme.palette.mode === 'light'
                          ? '#22222288'
                          : '#f0f',
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
                      value={can.payUnit}
                      onChange={handleChangeCan}
                      id="outlined"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Pay Unit"
                      labelId="pay-unit-select-label"
                      name="payUnit">
                      <MenuItem value={'all'}>All Unit</MenuItem>
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
                    <InputLabel id="role-select-label">Role</InputLabel>
                    <Select
                      value={can.role}
                      onChange={handleChangeCan}
                      id="outlined"
                      displayEmpty
                      inputProps={{ 'aria-label': 'Without label' }}
                      label="Role"
                      labelId="role-select-label"
                      name="role">
                      <MenuItem value={'all'}>All Role</MenuItem>
                      <MenuItem value={'onsite'}>Onsite</MenuItem>
                      <MenuItem value={'hybrid'}>Hybrid</MenuItem>
                      <MenuItem value={'remote'}>Remote</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </div>
              <GoogleMaps
                where={where}
                setWhere={(value: PlaceType) => setWhere(value)}
              />
              <div className="maps">
                <div id="map" style={{ height: '300px', overflow: 'hidden' }} />
              </div>

              <div className="actions">
                <Button variant="contained" onClick={handleSearch}>
                  SEARCH
                </Button>
              </div>
            </div>
            <div className="showlists">
              <ShowLists lists={lists} requestServer={getFavorites} />
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
    const collection = client.db().collection('search_texts')

    const textData = await collection.findOne(
      { email: session.user.email },
      { projection: { _id: 0, email: 0, 'text.user_email': 0 } }
    )

    const textPattern = analyseText(textData)
    return {
      props: {
        session,
        textPattern,
      },
    }
  } catch (err) {
    console.error('server side props error: ', err)
    return {
      props: {
        session,
      },
    }
  }
}
