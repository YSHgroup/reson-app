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
                bgcolor: 'background.paper',
                position: 'absolute',
                zIndex: 2,
                right: '67px',
                padding: 0,
                opacity: 0.6,
                top: '18px',
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
