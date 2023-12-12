import React from 'react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import { Divider } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { Box } from '@mui/system'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { getSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { language } from '../jotai'
import languagejson from '../language.json'
import { useAtom } from 'jotai'
import { usePersonalAnalysis } from 'hooks/usePersonalAnalysis'
import { connectToDatabase } from '@lib/db'

export default function Property({ userInfo }) {
  console.log('user Info: ', userInfo)
  const [lang] = useAtom(language)
  const list = [
    {
      name: 'Pro3',
      dir: 'S1',
    },
    {
      name: 'Pro4',
      dir: 'S4',
    },
    {
      name: 'Pro5',
      dir: 'S5',
    },
    {
      name: 'Pro6',
      dir: 'S6',
    },
    {
      name: 'Pro7',
      dir: 'S6',
    },
  ]
  return (
    <FullLayout title="Property">
      <Box
        sx={{
          background: '#fff4',
          position: 'relative',
        }}>
        <Typography
          variant="h3"
          sx={{
            '&:first-letter': {
              fontSize: '130%',
            },
            'line-height': '1.5',
            ml: 3,
          }}>
          {languagejson[lang].HEALTH}
        </Typography>
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
          }}>
          <IconButton LinkComponent={Link} href="/score">
            <Image src="/images/S2.png" alt="S2" width={140} height={140} />
          </IconButton>
        </Box>
      </Box>
      <Typography
        sx={{
          color: 'text.secondary',
          p: 2,
          pr: 14,
          '&:first-letter': {
            fontSize: '130%',
          },
          textTransform: 'uppercase',
        }}>
        {languagejson[lang].Youhaveexcellentphysicalconditionandhealth}
      </Typography>
      <List
        sx={{
          width: '100%',
          background: '#fff4',
        }}>
        {list.map((item, i) => (
          <React.Fragment key={item.name}>
            {i !== 0 && <Divider />}
            <ListItem>
              <ListItemText
                primary={<Typography variant="h4">{item.name}</Typography>}
              />
              <Image
                src={`/images/${item.dir}.png`}
                alt={item.dir}
                width={100}
                height={100}
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </FullLayout>
  )
}

export async function getServerSideProps (context: GetServerSidePropsContext) {
  //Cached server side
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )
  const {req} = context
  const session = await getSession({
    req,
  })

  // const protocal = req.headers['x-forwarded-proto'] || 'http'
  // const host = req.headers.host
  // const apiUrl = new URL('/api/user/info', `${protocal}://${host}`).toString()

  // const userRes = await fetch(apiUrl, { method: 'GET' })

  // console.log('user res--->', userRes.ok)
  // if (!userRes.ok) {
  //   console.error('Failed to fetch user info')
  // }
  // const userInfo = await userRes.json()

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
    console.log('email: ', email)
    const client = await connectToDatabase()
    const userCollection = client.db().collection('users')
    const userInfo = await userCollection.findOne({email: email}, {projection: {_id: 0, day_birth: 1, month_birth: 1, year_birth: 1}})
    console.log('user info: ', userInfo)

    if(!userInfo) throw new Error('--User info not found--')
    return {
      props: {
        session,
        userInfo
      }
    }
  } catch (err) {
    console.error('Failed to fetch user info: ', err)
    return {
      props: {
        session,
        userInfo: []
      }
    }
  }
}
