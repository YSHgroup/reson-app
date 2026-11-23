import React, { useState, useEffect, useRef } from 'react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import { Divider, keyframes, useMediaQuery, styled } from '@mui/material'
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
import { language, genderJot, personalStatusJot, dateColorJot } from '../state'
import languagejson from '../language.json'
import analysisDoc from '../constants/AnalysisDocument.json'
import { useAtom } from 'jotai'
import { usePersonalAnalysis } from 'hooks/usePersonalAnalysis'
import { GenNumForDate } from 'utils/GenNumForDate'
import { dateColor } from '@constants/Status'

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
  const [gender] = useAtom(genderJot)
  const [currentColor, setDateColor] = useAtom(dateColorJot)
  const numForDate = new GenNumForDate()
  useEffect(()=>{
    setDateColor(dateColor[Number(numForDate.getNum().substring(0, 2))])

  },[])
  const currentLangMode = ['EN', 'DE', 'RU', 'UA']
  const phoneBreakpoint = useMediaQuery('(max-width: 480px)')

  const PercentBar = styled('div')({
    height: '10px',
    width: 'calc(70% - 10px)',
    margin: '0 5px',
    borderRadius: '3px',
    border: `2px solid ${currentColor}`,
    overflow: 'hidden',
    '& div': {
      position: 'relative',
      height: '100%',
      backgroundColor: 'white',
      '&::after': {
        content: '""',
        position: 'absolute',
        right: '0',
        height: '100%',
        border: `.5px solid ${currentColor}`,
        boxShadow: `0 0 2px 1px ${currentColor}`
      }
    }
  })
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
  const data = analysisDoc[currentLangMode[lang]].map(property => property.criteria[gender])
  // convert the array to an Object by using the index as the keys
  // const dataObject = data.reduce((obj, val, i) => {
  //   obj[i] = val
  //   return obj
  // }, {})

  // otherway
  // const dataObject = Object.fromEntries(data.entries())
  // console.log("dataObject ---> ", dataObject)
  // console.table(direction)
  return (
    <FullLayout title="Property">
      <Box
        sx={{
          background: '#fff4',
          position: 'relative',
        }}>
        <Typography
          variant={phoneBreakpoint ? 'h5' : 'h4'}
          sx={{
            width: '50%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            '&:first-letter': {
              fontSize: '130%',
            },
            'line-height': '1.5',
            ml: 3,
          }}>
          {
            analysisDoc[currentLangMode[lang]][personalStatus.statusIndex]
              .criteria[gender]
          }
        </Typography>
        <PercentBar><div style={{width: `${Math.round((personalStatus.quantity / 6) * 100)}%`}}></div></PercentBar>
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
          }}>
          <Typography
            position={'absolute'}
            top={'5%'}
            left={'-10%'}
            fontFamily={'fantasy'}
            color="text.secondary"
            fontSize={phoneBreakpoint? '20px' : '24px'}>
            {`${Math.round((personalStatus.quantity / 6) * 100)}%`}
          </Typography>
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
              alt="Your status image"
              priority
              width={phoneBreakpoint? 100 :140}
              height={phoneBreakpoint? 100 :140}
            />
          </IconButton>
        </Box>
      </Box>
      <Typography
        sx={{
          color: 'text.secondary',
          p: 2, 
          pr: 14,
          fontSize: phoneBreakpoint? '12px': '1rem',
          minHeight: 30,
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
        {data.map((item, i) => (
          <React.Fragment key={item}>
            {i !== 0 && <Divider />}
            {!!analysisResult[0][i] && (
              <ListItemButton
                selected={i === personalStatus.statusIndex}
                sx={{
                  height: phoneBreakpoint? '3.8rem' : '5.8rem',
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
                  primary={
                    <Typography variant={phoneBreakpoint ? 'h6' : 'h5'}>
                      {item}
                    </Typography>
                  }
                />
                <Image
                  src={`/images/S${analysisResult[0][i]}.png`}
                  alt={item}
                  width={phoneBreakpoint? 50 :80}
                  height={phoneBreakpoint? 50 :80}
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
    const { prisma } = await import('@lib/prisma')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { birthday: true },
    })
    const birthday = user?.birthday
    const userInfo = birthday
      ? {
          day_birth: birthday.getDate(),
          month_birth: birthday.getMonth() + 1,
          year_birth: birthday.getFullYear(),
        }
      : []
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
