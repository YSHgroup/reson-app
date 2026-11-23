import * as React from 'react';
import { styled } from '@mui/material/styles';

// Create a global style component that styles scrollbars
const GlobalScrollbarStyle = styled('div')(({ theme }) => ({
  '& *::-webkit-scrollbar': {
    width: '0.4em',
  },
  '& *::-webkit-scrollbar-track': {
    boxShadow: `inset 0 0 6px ${theme.palette.grey[300]}`,
  },
  '& *::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    outline: `1px solid ${theme.palette.primary.dark}`,
  },
}));

export default function CustomScrollbar({children}: {children: React.ReactNode}) {
  return (
    <GlobalScrollbarStyle>
      {children}
    </GlobalScrollbarStyle>
  );
}
