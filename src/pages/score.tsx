import React, { useEffect } from 'react'
import { Divider, LinearProgress } from '@mui/material'
import { styled } from '@mui/material/styles'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { NextApiRequest } from 'next'
import { getSession } from 'next-auth/react'
import FullLayout from '@layouts/FullLayout/FullLayout'
import Image from 'next/image'
import { dateColorJot, language } from "../jotai"
import languagejson from "../language.json"
import { useAtom } from 'jotai'
import { GenNumForDate } from 'classes/GenNumForDate'
import { dateColor } from '@constants/Status'

export default function Score() {
  const [lang, setLanguage] = useAtom(language)
  const [currentColor, setDateColor] = useAtom(dateColorJot)
  const numForDate = new GenNumForDate()
  useEffect(()=>{
    setDateColor(dateColor[Number(numForDate.getNum().substring(0, 2))])

  },[])
  const PercentBar = styled('div')({
    height: '10px',
    width: 'calc(100% - 10px)',
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
  const list = [
    {
      name: 'READY',
      dir: 'S1',
    },
    {
      name: 'SMART',
      dir: 'S2',
    },
    {
      name: 'SPECI',
      dir: 'S3',
    },
    {
      name: 'PROFI',
      dir: 'S4',
    },
    {
      name: 'TALENTI',
      dir: 'S5',
    },
    {
      name: 'EXPERT',
      dir: 'S6',
    },
  ]
  return (
    <FullLayout title="Property">
      <List
        sx={{
          width: '100%',
          background: '#fff4',
        }}>
        {list.reverse().map((item, i) => (
          <React.Fragment key={item.name}>
            <ListItem >
              <ListItemText
                primary={
                  <Typography
                    variant="h3"
                    sx={{
                      '&:first-letter': {
                        fontSize: '130%',
                      },
                    }}>
                    {item.name}
                  </Typography>
                }
              />
              <Image
                src={`/images/${item.dir}.png`}
                alt={item.dir}
                width={100}
                height={100}
              />
            </ListItem>
            <PercentBar><div style={{width: `${(6 - i)/6 * 100}%`}}></div></PercentBar>
          </React.Fragment>
        ))}
      </List>
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
