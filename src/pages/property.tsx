import React, { useState, useEffect, useRef } from 'react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import {
  Divider,
  Collapse,
  keyframes,
  useMediaQuery,
  styled,
} from '@mui/material'
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
import { language, genderJot, personalStatusJot, dateColorJot } from '../jotai'
import languagejson from '../language.json'
import analysisDoc from '../constants/AnalysisDocument.json'
import { useAtom } from 'jotai'
import { usePersonalAnalysis } from 'hooks/usePersonalAnalysis'
import { connectToDatabase } from '@lib/db'
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
  useEffect(() => {
    setDateColor(dateColor[Number(numForDate.getNum().substring(0, 2))])
  }, [])
  const currentLangMode = ['EN', 'DE', 'RU', 'UA']
  const phoneBreakpoint = useMediaQuery('(max-width: 480px)')
  const colors = [
    ['#000000', '#FFF'],
    ['#00FF00', '#000'],
    ['#FF00FF', '#000'],
    ['#007FFF', '#FFF'],
    ['#FF7F00', '#000'],
    ['#0000FF', '#FFF'],
    ['#FF0000', '#FFF'],
    ['#00FFFF', '#000'],
    ['#FFFF00', '#000'],
  ]
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
        boxShadow: `0 0 2px 1px ${currentColor}`,
      },
    },
  })

  useEffect(() => {
    setAnalysis()
  }, [])
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const index = analysisResult[0].findIndex((first) => first)
    setStatus({ statusIndex: index, quantity: analysisResult[0][index] })
  }, [analysisResult])
  return (
    <FullLayout title="Property">
      <List
        sx={{
          width: '100%',
          background: '#fff4',
          padding: 1,
          paddingBottom: 2,
          minHeight: '100%',
        }}>
        {analysisDoc[currentLangMode[lang]]
          .map((property) => property.criteria[gender])
          .map((item, i) => (
            <React.Fragment key={item}>
              {/* {i === 0 && <div style={{ width: '100%', padding : '2.5px'}} />} */}
              {
                <>
                  <ListItemButton
                    // selected={i === personalStatus.statusIndex}
                    sx={{
                      position: 'relative',
                      padding: 0,
                      margin: `${
                        phoneBreakpoint
                          ? '1.4rem 1.5rem 00 1.5rem'
                          : '2rem 2rem 0 2rem'
                      }`,
                      border: '1px solid' + colors[i][0],
                      borderRadius: '.5rem',
                      borderBottomRightRadius:
                        i === personalStatus.statusIndex ? 0 : '0.5rem',
                      borderBottomLeftRadius:
                        i === personalStatus.statusIndex ? 0 : '0.5rem',
                      height: phoneBreakpoint ? '2.5rem' : '3.5rem',
                      '&.Mui-selected': {
                        bgcolor: 'primary.100',
                        '&:hover': {
                          bgcolor: 'primary.200',
                        },
                      },
                    }}
                    onClick={() =>
                      setStatus((pre) => ({
                        statusIndex: pre.statusIndex !== i ? i : null,
                        quantity:
                          analysisResult[0][i] >= 6 ? 6 : analysisResult[0][i],
                      }))
                    }>
                    <Box
                      sx={{
                        padding: 0,
                        position: 'absolute',
                        zIndex: -1,
                        width: '100%',
                        borderRadius: '.5rem',
                        borderBottomRightRadius:
                          i === personalStatus.statusIndex ? 0 : '0.5rem',

                        height: '100%',
                        overflow: 'hidden',
                      }}>
                      <Typography
                        display={i !== personalStatus.statusIndex ? 'none' : 'inline'}
                        component={'span'}
                        position={'absolute'}
                        left={phoneBreakpoint ? '4rem' : '6rem'}
                        fontSize={phoneBreakpoint ? '.8rem' : '1rem'}
                        sx={{
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontStyle: 'italic',
                            '&: first-letter': {
                                fontSize: '120%',
                            }
                        }}
                        >
                        {
                          [
                            'ZERO',
                            'READY',
                            'SMART',
                            'SPECI',
                            'PROFI',
                            'TALENTI',
                            'EXPERT',
                          ][analysisResult[0][i]]
                        }
                      </Typography>

                      <Box
                        sx={{
                          margin: 0,
                          height: '100%',
                          width: `${Math.round(
                            ((analysisResult[0][i] >= 6
                              ? 6
                              : analysisResult[0][i]) /
                              6) *
                              100
                          )}%`,
                          backgroundImage: `linear-gradient(to right, ${colors[i][0]}, transparent)`,
                          border: `2px solid ${colors[i][0]}`,
                        }}
                      />
                    </Box>

                    <Image
                      src={`/images/S${i + 1}.png`}
                      alt={item}
                      style={{
                        position: 'absolute',
                        left: phoneBreakpoint ? '-1rem' : '-1.5rem',
                        transform:
                          i === personalStatus.statusIndex
                            ? `scale(1.2) ${
                                phoneBreakpoint
                                  ? 'translate(3px, 3px)'
                                  : 'translate(5px, 5px)'
                              }`
                            : 'scale(1)',
                      }}
                      width={phoneBreakpoint ? 70 : 100}
                      height={phoneBreakpoint ? 70 : 100}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          component={'span'}
                          sx={{
                            fontSize: phoneBreakpoint ? '1rem' : '1.2rem',
                            float: 'right',
                            marginRight: phoneBreakpoint ? '10px' : '1rem',
                            textTransform: 'uppercase',
                            '&:first-letter': {
                              fontSize: '120%',
                            },
                          }}>
                          {item}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                  <Collapse
                    in={i === personalStatus.statusIndex}
                    sx={{
                      padding: 0,
                      margin: `${phoneBreakpoint ? '0 1.5rem' : '0 2rem'}`,
                      marginTop: 0,
                      border: '1px solid' + colors[i][0],
                      borderRadius: '0 0 .5rem .5rem',
                      // height: phoneBreakpoint ? '2.5rem' : '3.5rem',
                      '&.Mui-selected': {
                        bgcolor: 'primary.100',
                        '&:hover': {
                          bgcolor: 'primary.200',
                        },
                      },
                    }}>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        p: 2,
                        pl: phoneBreakpoint ? 2 : 8,
                        fontSize: phoneBreakpoint ? '12px' : '1rem',
                        // minHeight: 30,
                        '&:first-letter': {
                          fontSize: '130%',
                        },
                        textTransform: 'uppercase',
                      }}>
                      {
                        analysisDoc[currentLangMode[lang]][i].description[
                          personalStatus.quantity
                        ]
                      }
                    </Typography>
                  </Collapse>
                </>
              }
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
