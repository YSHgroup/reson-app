import * as React from 'react';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CommentIcon from '@mui/icons-material/Comment';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/router';
import ShowModal from './ShowModal';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface ListObject {
    _id: string,
    author: string,
    title: string,
    price: string,
    experience: string,
    often: string,
    from: string,
    desc: string,
    payType: string,
    until: string,
    when: string,
    file: string,
    location: string,

}
export default function GutterlessList(props: any) {
    const router = useRouter();
    const [selectList, setSelectList] = React.useState<ListObject>({
        _id: "",
        author: "",
        title: "",
        price: "",
        experience: "",
        often: "",
        from: "",
        desc: "",
        payType: "",
        until: "",
        when: "",
        file: "",
        location: "",
    });
    const [open, setOpen] = React.useState(false);
    const startChatting = (list: ListObject) => {
        router.push(`/chat?email=${list.author}`)
    }

    const handleClickOpen = (list: ListObject) => {
        setOpen(true);
        setSelectList(list);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectList({
            _id: "",
            author: "",
            title: "",
            experience: "",
            often: "",
            from: "",
            desc: "",
            payType: "",
            until: "",
            when: "",
            file: "",
            location: "",
            price: ""
        })
    };
    return (
        <>
            <List sx={{ width: '100%', bgcolor: 'primary' }}>
                {props.lists.length === 0 ?
                    <ListItem
                        disableGutters
                        sx={{
                            paddingLeft: "8px",
                            textAlign: "center",
                            cursor: "pointer"
                        }}
                    >
                        <ListItemText primary={"No result"} />
                    </ListItem> :
                    props.lists.map((list: ListObject) => (
                        <ListItem
                            key={list._id}
                            disableGutters
                            secondaryAction={
                                <IconButton
                                    aria-label="comment"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startChatting(list);
                                    }}
                                >
                                    <CommentIcon />
                                </IconButton>
                            }
                            sx={{
                                paddingLeft: "8px",
                                borderBottom: "1px solid",
                                cursor: "pointer"
                            }}
                            onClick={(e) => {
                                handleClickOpen(list);
                            }}
                        >
                            <ListItemText primary={list.title} />
                        </ListItem>
                    ))
                }
            </List>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {selectList.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {selectList.price} {selectList.payType}
                    </DialogContentText>
                    <DialogContentText id="alert-dialog-description">
                        {selectList.desc}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button onClick={() => startChatting(selectList)} >
                        Chatting
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}