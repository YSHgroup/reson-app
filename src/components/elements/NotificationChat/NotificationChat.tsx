import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
// import ListItemAvatar from '@mui/material/ListItemAvatar';
// import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
// import PropTypes from 'prop-types';

let callLabel = [
  'Missed call',
  'Declined call',
  'Incoming call'
]

export default function AlignItemsList(props: any) {
  const { totalUnreadChats, zIndex, left } = props;
  React.useEffect(()=>{
    console.log(totalUnreadChats)
  },[])
  return (
    <List sx={{ width: '100%', maxWidth: 300, bgcolor: 'background.paper', position: 'absolute', zIndex: zIndex, left: left }}>
      {
        totalUnreadChats.length ? totalUnreadChats.map((item: any, i: number) => {
          if (i > 2) return;
          else return (<>
              <Divider component="li" />
              <ListItem alignItems="flex-start">
                {/* <ListItemAvatar>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />
                </ListItemAvatar> */}
                <ListItemText
                  primary={(item.author ? item.author : item.posterEmail)}
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{ display: 'block' }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {item.type == 'text' && item.content}
                        {item.type == 'voiceCall' && callLabel[Number(item.content)]}
                      </Typography>
                      {` ${item.date} ${item.time}`}
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </>)
        }) 
          : 
        <React.Fragment>
          <Typography
            sx={{ textAlign: "center", display: 'block' }}
            component="span"
            variant="body2"
            color="text.primary"
          >
            {'There are no new messages.'}
          </Typography>
        </React.Fragment>
      }
    </List>
  );
}

// AlignItemsList.propTypes = {
//   totalUnreadChats: PropTypes.array.isRequired
// };