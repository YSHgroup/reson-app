import * as React from 'react'
import Head from 'next/head'
import ColorModeContext from 'context/ColorModeContext'
import cn from 'classnames'
import Fab from '@mui/material/Fab'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'

type BasicLayoutProps = {
  children: React.ReactNode
  title?: string
}

export default function BasicLayout({
  children,
  title = 'Reson App',
}: BasicLayoutProps) {
  const { mode, toggleColorMode } = React.useContext(ColorModeContext)
  const [style, setStyle] = React.useState({
    position: 'absolute',
    bottom: 100,
    right: 12,
    width: 36,
    height: 36,
    transition: 0.5
  })
  const mouseOut = (e: any) => {
    e.preventDefault();
    setStyle({
      position: 'absolute',
    bottom: 100,
    right: 12,
    width: 36,
    height: 36,
    transition: 0.5
    })
  }
  const mouseOver = (e: any) => {
    e.preventDefault();
    setStyle({
      position: 'absolute',
      bottom: 100,
      right: 12,
      width: 56,
      height: 56,
      transition: 0.5
    })
  }
  return (
    <>
      <Head>
        <title>Reson | {title}</title>
      </Head>
      <div
        className={cn('pageWrapper', {
          dark_background: mode === 'dark',
        })}>
        {children}
        <Fab
          color="primary"
          sx={style}
          onMouseOver={mouseOver}
          onMouseOut={mouseOut}
          onClick={toggleColorMode}>
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </Fab>
      </div>
    </>
  )
}
