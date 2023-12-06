import * as React from 'react'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { Divider } from '@mui/material'

export default function AlignItemsList({}) {
    return (
        <List
            className='notificationCalendar'
            sx={{
                width: '100%',
                maxWidth: 300,
                position: 'absolute',
                zIndex: 2,
                right: '67px',
                padding: 0,
                top: '18px',
                '&:before': {
                    position: 'absolute',
                    content: '""',
                    zIndex: -1,
                    top: 0,
                    bottom: 0,
                    right: 0,
                    left: 0,
                    bgcolor: 'background.paper',
                    opacity: 0.6
                  }
            }}
        >
            <React.Fragment>
                <Typography
                    sx={{
                        textAlign: 'center',
                        paddingY: '5px',
                        display: 'block',
                    }}
                    variant="body2"
                    component="span"
                    color="text.primary"
                >
                    {dayjs(Date.now()).format('ddd DD/MM/YYYY')}
                </Typography>
            </React.Fragment>
            <Divider />
            <React.Fragment>
                <Typography
                    sx={{ textAlign: 'center', display: 'block', paddingY: '3px' }}
                    component="span"
                    variant="body2"
                    color="text.primary">
                    {'There are no Tasks'}
                </Typography>
            </React.Fragment>
        </List>
    )
}
