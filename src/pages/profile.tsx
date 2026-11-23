import { useEffect } from 'react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import MenuIcon from '@mui/icons-material/Menu'
import Image from 'next/image'
import Box from '@mui/material/Box'
import dayjs, { Dayjs } from 'dayjs'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { NextApiRequest } from 'next'
import { green } from '@mui/material/colors'
import ButtonGroup from '@mui/material/ButtonGroup'
import InputAdornment from '@mui/material/InputAdornment'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import Link from 'next/link'
import { Collapse } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import React from 'react'
import { ArrowDropDown, ArrowLeft } from '@mui/icons-material'
import IconButton from '@mui/material/IconButton'
import { dateColorJot, genderJot, language } from '../state'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import SnackbarContext, { Snack } from 'context/SnackbarContext'
import { type AlertColor } from '@mui/material/Alert'
import { Fade, ListItemIcon, Menu, MenuItem } from '@mui/material'
import MenuData from '@constants/Menu.json'
import { getSession, signOut } from 'next-auth/react'
import { GenNumForDate } from 'utils/GenNumForDate'
import { dateColor } from '@constants/Status'

import ImageUploader from '../components/elements/ImageUploader'
import { LocalizationProvider, MobileDatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { connectToDatabase } from '@lib/db'
import { usePersonalAnalysis } from 'hooks/usePersonalAnalysis'

const { data: MenuDatas } = MenuData
export default function Profile({ userInfo }) {
  const energy = 54
  const opportunity = 21
  const [lang, setLanguage] = useAtom(language)
  const { setSnack } = React.useContext(SnackbarContext)
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [company, setCompany] = React.useState('')
  const [telephone, setTelephone] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [profession, setProfession] = React.useState('')
  const [education, setEducation] = React.useState('')
  const [hobby, setHobby] = React.useState('')
  const [carExist, setCarExist] = React.useState('')
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [status, setStatus] = React.useState(0)
  const [nickname, setNickName] = React.useState('')
  const [analysisResult, setAnalysis] = usePersonalAnalysis(userInfo)
  const [birthday, setBirthday] = React.useState<Dayjs | null>(
    dayjs(
      dayjs(
        !!userInfo
          ? `${userInfo.year_birth}-${userInfo.month_birth}-${userInfo.day_birth}T21:11:54`
          : '2004-01-01T21:11:54'
      )
    )
  )
  const [gender, setGender] = useAtom(genderJot)
  const [currentColor, setDateColor] = useAtom(dateColorJot)
  const numForDate = new GenNumForDate()
  useEffect(() => {
    setDateColor(dateColor[Number(numForDate.getNum().substring(0, 2))])
    setAnalysis()
    // setBirthday(
    //   dayjs(
    //     !!userInfo
    //       ? `${userInfo.year_birth}-${userInfo.month_birth}-${userInfo.day_birth}T21:11:54`
    //       : '2004-01-01T21:11:54'
    //   )
    // )
  }, [])
  // console.log('user information: ', birthday)
  const topen = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  useEffect(() => {
    getpic()
  }, [])

  const handleChange = () => {
    setOpen(!open)
  }
  // console.log('analytics date: ', birthday)
  const saveProfile = () => {
    let day_birth = birthday.date()
    let month_birth = birthday.month() + 1
    let year_birth = birthday.year()
    let userData = {
      email,
      firstName,
      lastName,
      company,
      telephone,
      address,
      profession,
      education,
      hobby,
      carExist,
      day_birth,
      month_birth,
      year_birth,
    }

    updateUser(userData)
  }

  const analyze = async () => {
    const response = await fetch('/api/number_analysis/number', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: process.env.NEXT_PUBLIC_BASE_URL + '/signin',
      })
    } catch (error) {
      console.error('There was an error signing out:', error)
    }
  }
  function getpic() {
    loadpic()
  }

  async function loadpic() {
    await fetch('/api/user/currentUser')
      .then((res) => res.json())
      .then((res) => {
        setEmail(res.data.email || '')
        setFirstName(res.data.firstName || '')
        setLastName(res.data.lastName || '')
        setCompany(res.data.company || '')
        setTelephone(res.data.telephone || '')
        setAddress(res.data.address || '')
        setProfession(res.data.profession || '')
        setEducation(res.data.education || '')
        setHobby(res.data.hobby || '')
        setStatus(parseInt(res.data.status) || 0)
        setStatus(res.data.carExist || '')
        setNickName(res.data.nickname || '')
        setGender(res.data.sex)
        // setBirthday(res.data.birthday || '')
      })
      .catch((err) => {})
  }
  async function updateUser(userData: object) {
    const response = await fetch('/api/profile/profile', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        status: 'error',
        data: data.message || 'Something went wrong!',
      }
    }

    setSnack(
      new Snack({
        message: 'Profile saved successfully',
        color: 'success' as AlertColor,
        open: true,
      })
    )

    // return {
    //   status: 'success',
    //   data: 'Profile saved successfully.',
    // }
  }

  return (
    <FullLayout title="Profile" appbar={false}>
      <Box
        sx={{
          m: 2,
          textAlign: 'center',
        }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
          <IconButton LinkComponent={Link} href="/settings">
            <Image
              src="/images/setting.png"
              alt="setting"
              width={50}
              height={50}
            />
          </IconButton>

          <Typography
            sx={{
              fontSize: 30,
              color: theme => theme.palette.primary.contrastText
            }}>
            {`${firstName} ${lastName}`}
          </Typography>
          <IconButton onClick={handleClick}>
            <Image src="/images/menu.png" alt="menu" width={50} height={50} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={topen}
            onClose={handleClose}
            TransitionComponent={Fade}>
            {MenuDatas.map(
              ({ name, href }, i) =>
                i !== 2 && (
                  <MenuItem key={name[0]} dense>
                    <Box
                      component={Link}
                      href={href}
                      sx={{ display: 'inherit' }}>
                      <ListItemIcon>
                        <Image
                          src={`/images/${name[0]}.png`}
                          alt={name[lang]}
                          width={20}
                          height={20}
                        />
                      </ListItemIcon>
                      {name[lang]}
                    </Box>
                  </MenuItem>
                )
            )}
            <MenuItem key={'profile'} dense>
              <Box
                component={Link}
                href={'/profile'}
                sx={{ display: 'inherit' }}>
                <ListItemIcon>
                  <Image
                    src={`/images/profile.png`}
                    alt={'profile'}
                    width={20}
                    height={20}
                  />
                </ListItemIcon>
                Profile
              </Box>
            </MenuItem>
            <MenuItem dense onClick={() => handleSignOut()}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
        <Box
          sx={{
            position: 'relative',
          }}>
          <Box
            sx={{
              background: 'white',
              borderRadius: 2,
              border: `5px solid ${currentColor}aa`,
              // padding: '12px',
              display: 'inline-grid',
              width: 'fit-content',
            }}>
            {/* <Image
              src="/images/avatar.png"
              alt="avatar"
              width={150}
              height={150}
            /> */}
            <ImageUploader />
          </Box>
          <Box
            sx={{
              top: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              left: 12,
              height: '150px',
              width: 24,
              backgroundImage: 'url(/images/statusbar.png)',
              backgroundSize: '100% 100%',
            }}>
            <Typography
              sx={{
                transform: 'rotate(90deg)',
                fontSize: 18,
              }}>
              {languagejson[lang].OPPORTUNITY}
            </Typography>
            <Typography
              sx={{
                width: '42px',
                lineHeight: '28px',
                backgroundColor: 'rgb(227,171,177)',
                color: 'white',
                textAlign: 'center',
                borderRadius: '0 6px 6px 0',
                position: 'absolute',
                bottom: `calc(${opportunity}% - 14px)`,
                left: 38,
                paddingLeft: '-2px',
                '&::after': {
                  content: '" "',
                  position: 'absolute',
                  left: '-14px',
                  top: '0',
                  marginLeft: '-14px',
                  borderWidth: '14px',
                  borderStyle: 'solid',
                  borderColor:
                    'transparent rgb(227,171,177) transparent transparent',
                },
              }}>
              {opportunity}%
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              right: 12,
              top: 0,
              height: '150px',
              width: 24,
              backgroundImage: 'url(/images/statusbar.png)',
              backgroundSize: '100% 100%',
            }}>
            <Typography
              sx={{
                transform: 'rotate(-90deg)',
                fontSize: 18,
              }}>
              {languagejson[lang].ENERGY}
            </Typography>
            <Typography
              sx={{
                width: '42px',
                lineHeight: '28px',
                backgroundColor: green[200],
                color: 'black',
                textAlign: 'center',
                borderRadius: '6px 0 0 6px',
                position: 'absolute',
                bottom: `calc(${(analysisResult[0][0] > 6? 6: analysisResult[0][0]) / 6 * 100}% - 14px)`,
                right: 38,
                '&::after': {
                  content: '" "',
                  position: 'absolute',
                  left: 'calc(100% + 14px)',
                  top: '0',
                  marginLeft: '-14px',
                  borderWidth: '14px',
                  borderStyle: 'solid',
                  borderColor: `transparent transparent transparent ${green[200]}`,
                },
              }}>
              {Math.round((analysisResult[0][0] > 6? 6: analysisResult[0][0]) / 6 * 100)}%
            </Typography>
          </Box>
          <Typography sx={{ color: 'text.primary' }}>{nickname}</Typography>
          <Button
            variant="text"
            // color="inherit"
            // sx={(theme) => theme.palette.mode ==='dark'? '#90caf9': '#1976d2'}
            size="large"
            sx={{
              color: (theme) =>
                theme.palette.mode === 'dark' ? '#82bfef' : '#1976d2',
              mt: 2,
            }}
            LinkComponent={Link}
            href="/property"
            onClick={analyze}>
            {languagejson[lang].Seeyourindividualanalysis}
          </Button>
          <div>
            <Button
              variant="text"
              color="inherit"
              size="large"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#82bfef' : '#1976d2',
                // mt: 2,
              }}
              LinkComponent={Link}
              href="/projects">
              {
                [
                  'Show My Projects',
                  'Meine Projekte anzeigen',
                  'Показать мои проекты',
                  'Показати мої проекти',
                ][lang]
              }
            </Button>
          </div>
          <div>
            <Button
              variant="text"
              size="large"
              // color='inherit'
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#82bfef' : '#1976d2',
              }}
              onClick={handleChange}
              endIcon={open ? <ArrowLeft /> : <ArrowDropDown />}>
              {languagejson[lang].Completetheinformation}
            </Button>
          </div>
          <Collapse in={open}>
            <TextField
              required
              fullWidth
              value={email}
              margin="normal"
              label="Email"
              onChange={(e) => {
                setEmail(e.target.value)
              }}
            />
            <TextField
              required
              fullWidth
              value={firstName}
              margin="normal"
              label="Firstname"
              onChange={(e) => {
                setFirstName(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={lastName}
              margin="normal"
              label="Surname"
              onChange={(e) => {
                setLastName(e.target.value)
              }}
            />
            <Grid
              item
              xs={12}
              marginTop="1rem"
              marginBottom=".5rem"
              // sx={{
              //   color: 'text.secondary',
              // }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                  label={languagejson[lang].birthDate}
                  format="DD/MM/YYYY"
                  slotProps={{
                    actionBar: {
                      sx: {
                        backgroundColor: 'background.paper',
                        button: {
                          color: 'text.primary',
                          '&:hover': { bgcolor: 'primary.light' },
                        },
                      },
                    },
                    textField: { required: true, fullWidth: true },
                  }}
                  value={birthday}
                  onChange={setBirthday}
                />
              </LocalizationProvider>
            </Grid>
            <TextField
              fullWidth
              margin="normal"
              label="Firma"
              value={company}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <LocationOnIcon />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                setCompany(e.target.value)
              }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Telephone number"
              value={telephone}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <ChatBubbleOutlineIcon />
                  </InputAdornment>
                ),
              }}
              onChange={(e) => {
                setTelephone(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={address}
              margin="normal"
              label="Address"
              onChange={(e) => {
                setAddress(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={profession}
              margin="normal"
              label="Profession"
              onChange={(e) => {
                setProfession(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={education}
              margin="normal"
              label="Education"
              onChange={(e) => {
                setEducation(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={carExist}
              margin="normal"
              label="Do you have Car"
              onChange={(e) => {
                setCarExist(e.target.value)
              }}
            />
            <TextField
              fullWidth
              value={hobby}
              margin="normal"
              label="Hobby"
              onChange={(e) => {
                setHobby(e.target.value)
              }}
            />
            <ButtonGroup variant="contained" sx={{ mt: 2 }} fullWidth>
              <Button onClick={saveProfile}>
                {languagejson[lang].Savechanges}
              </Button>
              <Button>{languagejson[lang].Jointheclub}</Button>
              <Button>{languagejson[lang].BuyReson}</Button>
            </ButtonGroup>
          </Collapse>
        </Box>
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
    const email = session.user.email
    const client = await connectToDatabase()
    const userCollection = client.db().collection('users')
    const userInfo = await userCollection.findOne(
      { email: email },
      { projection: { _id: 0, day_birth: 1, month_birth: 1, year_birth: 1 } }
    )

    if (!userInfo) throw new Error('--User info not found--')
    return {
      props: {
        session,
        userInfo,
      },
    }
  } catch (err) {
    console.error('Failed to fetch user info: ', err)
    return {
      props: {
        session,
        userInfo: [],
      },
    }
  }
}
