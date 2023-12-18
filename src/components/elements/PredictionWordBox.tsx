import {ListItem} from '@mui/material'
import {styled} from '@mui/material/styles'

export const WordsDropdown = styled('div')(({ theme }) => ({
    // position: 'absolute',
    width: '100%',
    padding: '3px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    fontSize: '1.2rem',
    borderRadius: '3px',
  }))
export const TextItem = styled(ListItem)(({ theme }) => ({
    // padding: '3px 0',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }))