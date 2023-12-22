import React, { useState, useEffect, useRef } from 'react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import { Divider, keyframes } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { Box } from '@mui/system'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { getSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { language, personalStatusJot } from '../jotai'
import languagejson from '../language.json'
import analysisDoc from '../constants/AnalysisDocument.json'
import { useAtom } from 'jotai'
import { usePersonalAnalysis } from 'hooks/usePersonalAnalysis'
import { connectToDatabase } from '@lib/db'

const animationBtn = keyframes`
0% {
  transform: scale(1);
}
70% {
  transform: scale(1.2) rotate(180deg);
  opacity: 0.5;
}
100% {
  transform: scale(1) rotate(360deg);
}
`

export default function Property({ userInfo }) {
  const isFirstRender = useRef(true)
  const [personalStatus, setStatus] = useState({ statusIndex: 0, quantity: 0 })
  const [analysisResult, setAnalysis] = usePersonalAnalysis(userInfo)
  const [lang] = useAtom(language)
  const list = [
    'Pro1',
    'Pro2',
    'Pro3',
    'Pro4',
    'Pro5',
    'Pro6',
    'Pro7',
    'Pro8',
    'Pro9',
  ]
  const currentLangMode = ['EN', 'DE', 'RU', 'UA']
  useEffect(() => {
    setAnalysis()
  }, [])
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const index = analysisResult[0].findIndex((first) => first !== 0)
    setStatus({ statusIndex: index, quantity: analysisResult[0][index] })
  }, [analysisResult])
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
          {
            analysisDoc[currentLangMode[lang]][personalStatus.statusIndex]
              .criteria['male']
          }
        </Typography>
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
          }}>
          <IconButton
            sx={{
              transition: '.5S',
              '&:hover': {
                // transform: 'rotate(180deg)',
                animation: `${animationBtn} 0.5s linear`,
              },
            }}
            LinkComponent={Link}
            href="/score">
            <Image
              src={`/images/S${
                personalStatus.quantity % 6 !== 0
                  ? personalStatus.quantity % 6
                  : 1
              }.png`}
              alt="S2"
              priority
              width={140}
              height={140}
            />
          </IconButton>
        </Box>
      </Box>
      <Typography
        sx={{
          color: 'text.secondary',
          p: 2,
          pr: 14,
          minHeight: 50,
          '&:first-letter': {
            fontSize: '130%',
          },
          textTransform: 'uppercase',
        }}>
        {
          analysisDoc[currentLangMode[lang]][personalStatus.statusIndex]
            .description[personalStatus.quantity]
        }
      </Typography>
      <List
        sx={{
          width: '100%',
          background: '#fff4',
          padding: 0,
        }}>
        {list.map((item, i) => (
          <React.Fragment key={item}>
            {i !== 0 && <Divider />}
            {!!analysisResult[0][i] && (
              <ListItemButton
                selected={i === personalStatus.statusIndex}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.100',
                    '&:hover': {
                      bgcolor: 'primary.200',
                    },
                  },
                }}
                onClick={() =>
                  setStatus({
                    statusIndex: i,
                    quantity:
                      analysisResult[0][i] >= 6 ? 6 : analysisResult[0][i],
                  })
                }>
                <ListItemText
                  primary={<Typography variant="h4">{item}</Typography>}
                />
                <Image
                  src={`/images/S${analysisResult[0][i]}.png`}
                  alt={item}
                  width={100}
                  height={100}
                />
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
      </List>
    </FullLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  //Cached server side
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=10, stale-while-revalidate=59'
  )
  const { req } = context
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
    console.log('email: ', email)
    const client = await connectToDatabase()
    const userCollection = client.db().collection('users')
    const userInfo = await userCollection.findOne(
      { email: email },
      { projection: { _id: 0, day_birth: 1, month_birth: 1, year_birth: 1 } }
    )
    console.log('user info: ', userInfo)

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
