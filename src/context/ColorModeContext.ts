import React from 'react'

const ColorModeContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleColorMode: () => {},
  setColorMode: (value: any) => {},
  mode: 'default',
})

export default ColorModeContext
