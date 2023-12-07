import FullLayout from '@layouts/FullLayout/FullLayout'
import { Dialog, DialogTitle, Divider, ListItemButton } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import React, { useContext } from 'react'
import SettingData from '@constants/Setting.json'
import {
  language,
  modusJot,
  statusJot,
  firstnameJot,
  lastnameJot,
  emailJot,
  telephoneJot,
  personalAnalysisJot,
  currentPositionJot,
} from '../jotai'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import cookies from 'browser-cookies'
import ColorModeContext from 'context/ColorModeContext'

export interface SimpleDialogProps {
  index: number
  open: boolean
  selectedValue: number
  settings: any
  onClose: (value: number) => void
}

function SimpleDialog(props: SimpleDialogProps) {
  const [modus, setModus] = useAtom(modusJot)
  const [lang, setLanguage] = useAtom(language)
  const { onClose, selectedValue, open, index, settings } = props
  const { name: title, options } = SettingData[lang][index]
 const {setColorMode} = useContext(ColorModeContext)
  const handleClose = () => {
    onClose(selectedValue)
  }

  const keys = Object.keys(settings)
  settings.language = lang
  settings.modus = modus
  const handleListItemClick = (value: { index: number; i: number }) => {
    // console.log('key----->', [keys[value.index], value.index, value.i])
    settings[keys[value.index]] = value.i
    console.table(settings)
    const modeState = ['dark', 'light', 'default']
    if (keys[value.index] == "modus") {localStorage.setItem('color_mode', modeState[value.i])
    setColorMode(modeState[value.i])}
    setModus(value.i)
    setSetting(settings)
    onClose(value.i)
  }
  // console.log('setting-modus-->', modus)

  async function setSetting(settings: object) {
    const response = await fetch('/api/setting/setting', {
      method: 'POST',
      body: JSON.stringify(settings),
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

    return {
      status: 'success',
      data: 'Please verify with the code that is sent to your email.',
    }
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <List sx={{ pt: 0 }}>
        {options.map((option, i) => (
          <ListItem key={option + i} disableGutters>
            <ListItemButton onClick={() => handleListItemClick({ index, i })}>
              <ListItemText primary={option} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Dialog>
  )
}

export default function Settings() {
  const [lang, setLanguage] = useAtom(language)
  const [modus, setModus] = useAtom(modusJot)
  const [status, setStatus] = useAtom(statusJot)
  const [firstname, setFirstname] = useAtom(firstnameJot)
  const [lastname, setLastname] = useAtom(lastnameJot)
  const [email, setEmail] = useAtom(emailJot)
  const [telephone, setTelephone] = useAtom(telephoneJot)
  const [personalAnalysis, setPersonalAnalysis] = useAtom(personalAnalysisJot)
  const [currentPosition, setCurrentPosition] = useAtom(currentPositionJot)
  const [open, setOpen] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [bal, setbal] = React.useState([0, 0, 0, 0, 0, 0, 0, 0, 0])
  const [selectedValues, setSelectedValues] = React.useState([
    [0, 1, 2, 3],
    [0, 1, 2],
    [0, 1, 2, 3],
    [0, 1, 2],
    [0, 1, 2],
    [0, 1, 2],
    [0, 1, 2],
    [0, 1, 2],
    [0, 1],
  ])
  const [position, setPosition] = React.useState<any>('')

  const settingArr = {
    language: lang,
    modus: modus,
    status: status,
    show_firstname: firstname,
    show_lastname: lastname,
    show_email: email,
    show_telephone: telephone,
    show_analyse: personalAnalysis,
  }
  console.log('---settingArr----')
  console.table(settingArr)
  React.useEffect(() => {
    getGeoPosition()
    const getCurrentSetting = async () => {
      const response = await fetch('/api/setting/currentSetting', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      let settingData = await response.json()
      setLanguage(settingData.data.language)
      setModus(settingData.data.modus)
      setStatus(settingData.data.status)
      setFirstname(settingData.data.show_firstname)
      setLastname(settingData.data.show_lastname)
      setTelephone(settingData.data.show_telephone)
      setPersonalAnalysis(settingData.data.show_analyse)
      setEmail(settingData.data.show_email)
      setCurrentPosition(
        settingData.data.length === 11 ? settingData.data.show_position : 0
      )
    }
    getCurrentSetting()

  }, [])

  const getGeoPosition = async () => {
    const response = await fetch(`https://ipapi.co/json`)
    const countryCode = await response.json()
    setPosition(countryCode)
  }

  const handleClickOpen = (index: number) => {
    setCurrentIndex(index)
    setOpen(true)
  }
  const handleClose = (value: number) => {
    setOpen(false)
    const values = selectedValues[currentIndex]
    values[bal[currentIndex]] = value

    switch (currentIndex) {
      case 0:
        setLanguage(values[bal[currentIndex]])
        break
      case 1:
        setModus(values[bal[currentIndex]])
        break
      case 2:
        setStatus(values[bal[currentIndex]])
        break
      case 3:
        setFirstname(values[bal[currentIndex]])
        break
      case 4:
        setLastname(values[bal[currentIndex]])
        break
      case 5:
        setEmail(values[bal[currentIndex]])
        break
      case 6:
        setTelephone(values[bal[currentIndex]])
        break
      case 7:
        setPersonalAnalysis(values[bal[currentIndex]])
      default:
        setCurrentPosition(values[bal[currentIndex]])
    }
    // console.log( values[bal[currentIndex]])
    // setSelectedValues(values)
  }
  return (
    <FullLayout title={'Settings'}>
      <List
        sx={{
          width: '100vw',
        }}>
        {SettingData[lang].map(({ name, options }, i) => (
          <React.Fragment key={name + options + i}>
            {i !== 0 && <Divider />}
            <ListItem onClick={() => handleClickOpen(i)}>
              <ListItemText primary={name} />
              {i == 0 ? (
                <Typography component={'span'}>{options[lang]}</Typography>
              ) : (
                <Typography component={'span'}>
                  {options[selectedValues[i][0] || 0]}
                </Typography>
              )}
            </ListItem>
          </React.Fragment>
        ))}
        <Divider />
        <ListItem key={'geoposition'}>
          <ListItemText primary="Current Position" />
          <Typography component={'span'}>
            {!currentPosition
              ? position && `${position.city} ${position.country}`
              : ''}
          </Typography>
        </ListItem>
      </List>
      <SimpleDialog
        index={currentIndex}
        selectedValue={selectedValues[currentIndex][bal[currentIndex]]}
        open={open}
        onClose={handleClose}
        settings={settingArr}
      />
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
