import type { Components, Theme } from '@mui/material/styles'

const sidenav: Components<Theme>['MuiDrawer'] = {
  styleOverrides: {
    root: {
      width: '250px',
      whiteSpace: 'nowrap',
      border: 'none',
    },

    paper: {
      width: '250px',
      height: 'calc(100vh - 2rem)',
      margin: '1rem',
      borderRadius: '.5rem',
      border: 'none',
    },

    paperAnchorDockedLeft: {
      borderRight: 'none',
    },
  },
}

export { sidenav }