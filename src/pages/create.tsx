import BasicLayout from '@layouts/BasicLayout'
import AvTimerIcon from '@mui/icons-material/AvTimer'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import PaymentIcon from '@mui/icons-material/Payment';
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import { language } from "../jotai"
import languagejson from "../language.json"
import { useAtom } from 'jotai'
import { useState, useContext } from 'react'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { FormControl, IconButton, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { SelectChangeEvent } from '@mui/material/Select';
import 'react-swipeable-list/dist/styles.css';
import SnackbarContext, { Snack } from 'context/SnackbarContext'
interface Can {
  title: string | null,
  location: string | null,
  experience: Number | 0,
  when: Date | null,
  from: Date | null,
  until: Date | null,
  desc: string | null,
  price: string | null,
  payType: string,
  often: string | null,
}
export default function Home() {
  const [lang, setLanguage] = useAtom(language)
  const [data, setData] = useState([])
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const { setSnack } = useContext(SnackbarContext)

  const [value, setValue] = useState(0)


  const [can, setCan] = useState<Can>({
    title: "",
    experience: 0,
    when: null,
    from: null,
    until: null,
    location: "",
    desc: "",
    price: '',
    payType: 'piece',
    often: '',
  });

  const handleChangeUpload = (e: any) => {
    setFile(e.target.files[0]);
  }
  const handleWhenDateChange = (date: any) => {
    setCan({ ...can, when: date })
  }
  const handleFromTimeChange = (time: any) => {
    setCan({ ...can, from: time })
  }
  const handleUntilTimeChange = (time: any) => {
    setCan({ ...can, until: time })
  }
  const handlePayTypeChange = (e: SelectChangeEvent) => {
    setCan({ ...can, payType: e.target.value })
  }

  const handleClose = () => {
    router.back()
  }


  const handleChange = (
    event: React.SyntheticEvent | Event,
    newValue: number
  ) => {
    setValue(newValue)
  }

  const submitpublishorsave = async () => {
    if (can.desc === "" || can.title === "" || file === null) {
      setSnack(
        new Snack({
          message: 'Title, description, and example file are required items.',
          color: 'error',
          open: true,
        })
      )
    } else {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fields', JSON.stringify(can));

      try {
        const response = await fetch('/api/need/create', {
          method: "POST",
          body: formData
        });
        if (response.ok) {
          setSnack(
            new Snack({
              message: "Successful ",
              color: 'success',
              open: true,
            })
          );
          setFile(null);
          setCan({
            title: "",
            experience: 0,
            when: null,
            from: null,
            until: null,
            location: "",
            desc: "",
            price: '',
            payType: 'piece',
            often: '',
          })
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
  }
  return (
    <BasicLayout title={languagejson[lang].CAN}>
      <div className="page">
        <div className="create">
          <div className="header">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <IconButton
                size="large"
                edge="end"
                aria-label="menu"
                onClick={handleClose}>
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <TextField
              required
              id="outlined-required"
              placeholder="What can you do?"
              sx={{
                width: '100%',
              }}
              variant="outlined"
              label="What can you do?"
              value={can.title}
              onChange={e => setCan({ ...can, title: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

          </div>
          <div className="main">
            <div className="feeling">
              <Typography>{languagejson[lang].Bad}</Typography>
              <Slider
                value={can.experience}
                color="secondary"
                valueLabelDisplay='auto'
                sx={{
                  display: 'inline',
                  flex: 1,
                  margin: '0 30px',
                }}
                onChange={e => {
                  if (e && e.target) {
                    setCan({ ...can, experience: e.target.value })
                  }
                }}
              />
              <Typography>{languagejson[lang].Verygood}</Typography>
            </div>
            <div className="example">
              <Typography>{languagejson[lang].Showexample}:</Typography>
              <Typography>{file !== null && file.name}</Typography>
              <Button component="label" variant='contained' startIcon={<CloudUploadIcon />}>
                Upload File
                <input
                  type='file'
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
            <div className="location">
              <LocationOnIcon
                sx={{
                  fontSize: 50,
                  marginRight: '20px',
                }}
              />
              <TextField
                required
                placeholder="Location?"
                id="outlined-required"
                sx={{
                  width: '100%',
                }}
                variant="outlined"
                label="Location?"
                value={can.location}
                onChange={e => setCan({...can, location: e.target.value})}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
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
                  justifyContent: 'space-between'
                }}
              >
                <DatePicker
                  label="When"
                  value={can.when}
                  onChange={handleWhenDateChange}
                  renderInput={(props) => <TextField sx={{ width: '45%' }} {...props} />}
                />
                <TextField
                  sx={{ width: '45%' }}
                  placeholder="how often"
                  id="input-with-icon-textfield"
                  variant="outlined"
                  label="How often?"
                  type="number"
                  inputProps={{
                    min: 0
                  }}
                  value={can.often}
                  onChange={e => setCan({ ...can, often: e.target.value })}
                />
              </Box>
            </div>
            <div className="timer">
              <Box>
                <AvTimerIcon
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
                  justifyContent: 'space-between'
                }}
              >
                <TimePicker
                  value={can.from}
                  onChange={handleFromTimeChange}
                  id="input-with-icon-textfield"
                  variant="outlined"
                  label="From"
                  renderInput={(props) => <TextField sx={{
                    width: '45%',
                  }} {...props} />}
                />
                <TimePicker
                  value={can.until}
                  onChange={handleUntilTimeChange}
                  id="input-with-icon-textfield"
                  variant="outlined"
                  label="Until"
                  renderInput={(props) => <TextField sx={{
                    width: '45%',
                  }} {...props} />}
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
                  justifyContent: 'space-between'
                }}
              >
                <TextField
                  value={can.price}
                  sx={{
                    width: '45%'
                  }}
                  label="Price"
                  type="number"
                  inputProps={{
                    min: 0
                  }}
                  placeholder="Price"
                  onChange={e => setCan({ ...can, price: e.target.value })}
                />
                <FormControl sx={{ width: '45%' }}>
                  <InputLabel id="per-price-select-label">Per Price</InputLabel>
                  <Select
                    value={can.payType}
                    id='outlined'
                    onChange={handlePayTypeChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    label="Per Price"
                    labelId="per-price-select-label"
                  >
                    <MenuItem value={'piece'}>per Piece</MenuItem>
                    <MenuItem value={'hour'}>per Hour</MenuItem>
                    <MenuItem value={'unit'}>per Unit</MenuItem>
                    <MenuItem value={'free'}>for Free</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </div>
            <TextField
              value={can.desc}
              onChange={e => { setCan({ ...can, desc: e.target.value }) }}
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
            <div className="actions">
              <Button
                sx={{
                  width: '150px',
                }}
                onClick={() => { submitpublishorsave() }}
                variant="contained">
                {languagejson[lang].Publish}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </BasicLayout>
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
