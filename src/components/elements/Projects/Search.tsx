import { useState, useContext } from 'react'
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
import { language } from '../../../jotai'
import languagejson from '../../../language.json'
import ShowLists from 'components/elements/Search/ShowLists'
import 'react-swipeable-list/dist/styles.css'
import 'mapbox-gl/dist/mapbox-gl.css'

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
export default function SearchComponent({
  onItemChange,
}: {
  onItemChange?: () => void
}) {
  const [lang, setLanguage] = useAtom(language)
  const { setSnack } = useContext(SnackbarContext)
  const [ip, setIp] = useState<string | null>(null)
  const [lists, setLists] = useState([])
  const [sliderValue, setSliderValue] = useState<number[]>([0, 5000])
  const [can, setCan] = useState<CanFormType>({
    title: '',
    payUnit: 'all',
    role: 'all',
  })
  const [where, setWhere] = useState<PlaceType | null>(null)

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
    ).then((response) => response.json())
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
      console.table(can)
      await fetch('/api/need/search-analysis', {
        method: 'POST',
        body: JSON.stringify({ can }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.log('search analysis error:', error)
    }
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      <div className="page" style={{ height: 'auto', margin: '2rem auto' }}>
        <div className="search" style={{ margin: 'auto' }}>
          <div className="main">
            <TextField
              sx={{
                width: '100%',
              }}
              variant="outlined"
              name="title"
              label={languagejson[lang].whatYouAreLookingFor}
              value={can.title}
              onChange={handleChangeCan}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
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
                  <InputLabel id="per-price-select-label">Pay Unit</InputLabel>
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
            {/* <div className="maps">
                <div id="map" style={{ height: '300px', overflow: 'hidden' }} />
              </div> */}

            <div className="actions">
              <Button variant="contained" onClick={handleSearch}>
                SEARCH
              </Button>
            </div>
          </div>
          <div className="showlists">
            <ShowLists lists={lists} requestServer={onItemChange} />
          </div>
        </div>
      </div>
    </Box>
  )
}
