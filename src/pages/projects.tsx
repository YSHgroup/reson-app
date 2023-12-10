import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  Badge,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  ListItemButton,
  TextField,
  Tabs,
  Tab,
  Typography,
} from '@mui/material'
import List from '@mui/material/List'
import { Stack } from '@mui/system'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Search as SearchIcon } from '@mui/icons-material'
import { language } from '../jotai'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import CustomTabPanel from '@elements/Projects/CustomTabPanel'

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export default function Projects() {
  const [lang, setLanguage] = useAtom(language)
  const [value, setValue] = React.useState(0)
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const router = useRouter()
  const labels = ["Projects", "Task", "Search", "Favorites"]
  return (
    <FullLayout title={languagejson[lang].Myproject}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example">
            {labels.map((label: string, i: number) => <Tab key={i} label={languagejson[lang].MyprojectTab[i]} {...a11yProps(i)} />)}
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0} />
      <CustomTabPanel value={value} index={1} />
      <CustomTabPanel value={value} index={2} />
      <CustomTabPanel value={value} index={3} />
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
