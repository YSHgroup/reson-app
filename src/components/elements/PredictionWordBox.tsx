import {ListItem} from '@mui/material'
import {styled} from '@mui/material/styles'

export const WordsDropdown = styled('div')(({ theme }) => ({
    width: '100%',
    padding: '3px',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.primary,
    fontSize: '1.2rem',
    borderRadius: '3px',
  }))
export const TextItem = styled(ListItem)(({ theme }) => ({
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  }))