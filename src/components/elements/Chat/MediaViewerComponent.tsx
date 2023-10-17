import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

type MediaType = {
    content: string
    type: string
}

interface MediaViewerProps {
    open: boolean;
    handleClose: () => void;
    content: MediaType;
}

export default function MediaViewer({ open, handleClose, content }: MediaViewerProps) {
    return (
        <>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                    Media Viewer
                </DialogTitle>
                <DialogContent>
                    {content.type == 'image' ? <img src={`/api/view?name=chats/${content.content}`} alt={content.content} width="100%" /> : <video src={`/api/view?name=${content.content}`} width="100%" controls />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Close</Button>
                    <a href={`/api/view?name=chats/${content.content}`} download>
                        <Button color="primary">Download</Button>
                    </a>
                </DialogActions>
            </Dialog>
        </>
    )
}
