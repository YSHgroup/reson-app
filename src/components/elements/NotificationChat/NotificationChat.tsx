import * as React from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

let callLabel = ['Missed call', 'Declined call', 'Incoming call']

export default function AlignItemsList({ totalUnreadChats }) {
  return (
    <List
      sx={{
        width: '100%',
        maxWidth: 300,
        bgcolor: 'background.paper',
        position: 'absolute',
        zIndex: 2,
        left: '67px',
        padding: 0,
        opacity: 0.6,
        top: '18px',
        // visibility: 'hidden'
        display: 'none'
      }}
      className='unreadMessageNotification'
    >
      <React.Fragment>
        <Typography
          sx={{
            textAlign: 'center',
            paddingY: '5px'
          }}
        >
          Unread Messages
        </Typography>
      </React.Fragment>
      {totalUnreadChats.length ? (
        totalUnreadChats.map((item: any, i: number) => {
          if (i < 2) return (
            <React.Fragment key={item._id}>
              <Divider component="li" />
              <ListItem >
                <ListItemText
                  primary={item.author ? item.author : item.posterEmail}
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{
                          display: 'block',
                          wordWrap: "break-word"
                        }}
                        component="span"
                        variant="body2"
                        color="text.primary">
                        {item.type == 'text' && item.content}
                        {item.type == 'voiceCall' &&
                          callLabel[Number(item.content)]}
                      </Typography>
                      {` ${item.date} ${item.time}`}
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
              {i === 1 && (<Typography
                sx={{
                  textAlign: 'center',
                }}
              >
                ...
              </Typography>)}
            </React.Fragment>
          )
        })
      ) : (
        <React.Fragment>
          <Typography
            sx={{ textAlign: 'center', display: 'block' }}
            component="span"
            variant="body2"
            color="text.primary">
            {'There are no new messages.'}
          </Typography>
        </React.Fragment>
      )}
    </List>
  )
}

// AlignItemsList.propTypes = {
//   totalUnreadChats: PropTypes.array.isRequired
// };
