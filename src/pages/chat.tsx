import React, { Fragment, useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import ReactDOM from 'react-dom';
import FullLayout from '@layouts/FullLayout/FullLayout'
import { AttachFile as AttachFileIcon, Close, Minimize, Mail as MailIcon, Send, Mic as MicIcon, Phone, PhoneDisabled, CallEnd, PhoneEnabled, PhoneInTalk, CallReceived, CallMade, MoreHoriz, Padding, Flag } from '@mui/icons-material'
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Fab from '@mui/material/Fab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography, Avatar, Grid } from '@mui/material'
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Box from '@mui/material/Box'
import { NextApiRequest } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import io from "socket.io-client";
import Peer from "simple-peer";
import { formatTime, timestampToFormattedDate } from "@lib/utils";
import { useWindowSize } from "@react-hook/window-size";
import Link from 'next/link'
import cn from 'classnames'
import { ContentReactedEmojis, EmojiChildComponent } from "@elements/ContentReactedEmojis";
// import { v4 as uuidv4 } from 'uuid';
// import e from "cors";
// import { useAtom } from 'jotai';
import styles from '../styles/chat.module.scss';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { StyledEngineProvider } from '@mui/material/styles';


const cache = createCache({
    key: 'css',
    prepend: true,
});

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

let socket: any;

let peer: any;

// type Message = {
//     author: string;
//     message: string;
// };

type MediaType = {
    content: string
    type: string
}

interface MediaViewerProps {
    open: boolean;
    handleClose: () => void;
    content: MediaType;
}

const ICE_SERVERS = [
    // Add more STUN and TURN servers here
    { urls: 'stun:stun.l.google.com:19302' },
];

const AUDIO_CONSTRAINTS = { audio: true, video: false };
const VIDEO_CONSTRAINTS = {
    audio: false,
    video: {
        deviceId: {
            exact: 'a3537551792d9bbb19b8de90745903edf56fecc1f175b3a988b7b537421469eb'
        }
    }
};

const beaks = [
    '/audios/ring1.mp3',
    '/audios/ring2.mp3',
    '/audios/ring3.mp3',
    '/audios/ring4.mp3'
]
let audio1: HTMLAudioElement, audio2: HTMLAudioElement, audio3: HTMLAudioElement, audio4: HTMLAudioElement;

let callLabel = [
    'Canceled call',
    'Declined call',
    'Outgoing call'
];

let callLabel_ = [
    'Missed call',
    'Declined call',
    'Incoming call'
]

const IsCallingContext = createContext<boolean>(false);

export default function Chat() {
    const router = useRouter()
    const { email } = router.query
    const { data: session } = useSession()
    const [pic, setPic] = useState("");
    const [inputValue, setInputValue] = useState<string>("");
    const [messages, setMessages] = useState<Array<any>>([]);
    // const [playBeak, setPlayBeak] = useState<Boolean>(false);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [selectedContent, setSelectedContent] = useState({ content: "", type: "" });
    const [, windowHeight] = useWindowSize();
    const [isCalling, setIsCalling] = useState<boolean>(false);
    const [beingCalled, setBeingCalled] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);
    const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(undefined);
    const [socketId, setSocketId] = useState<String | null>(null)
    const [openSnack, setOpenSnack] = useState(false);
    const [snackText, setSnackText] = useState('');
    const [callAccepted, setCallAccepted] = useState(false);
    const [callerSignal, setCallerSignal] = useState(null);

    // voice message : false, general message: true
    const [messageType, setMessageType] = useState(true);
    // recoding time max: 5min
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploadBlob, setIsUploadBlob] = useState(false);
    // 
    const recordedChunks = useRef<Blob[]>([]);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const [disabledButton, setDisabledButton] = useState<boolean>(false);
    // let mediaRecorder: MediaRecorder;

    const myAudio = useRef<any>(null);
    const connection = useRef();
    const isCallingRef = useRef(false);
    const localStreamRef = useRef<MediaStream | undefined>(undefined);
    const remoteStreamRef = useRef<MediaStream | undefined>(undefined);
    const [minimizeCall, setMinimizeCall] = useState<boolean>(false);
    const callStatusRef = useRef<any>(undefined);
    const callIdRef = useRef<any>(undefined);
    const [dropdownFlag, setDropDownFlag] = useState<boolean>(true);

    const handleClick = (content: any, type: any) => {
        setSelectedContent({ content: content, type: type });
        setOpen(true);
    };

    const handleSetMessageType = (value: boolean) => {
        if (value) {
            stopVoiceRecording(false);
        }
        setMessageType(value);
    }

    const handleMediaRecorderInit = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            localStreamRef.current = stream;
            startVoiceRecording();
        } catch (error) {
            setSnackText(`${error}`);
            setOpenSnack(true);
        }
    }

    const startVoiceRecording = () => {
        recordedChunks.current = [];

        let stream = localStreamRef.current;
        setMessageType(false);
        try {
            if (stream) {
                mediaRecorder.current = new MediaRecorder(stream as MediaStream);
            }
        } catch (error) {
            setSnackText(`${error}`);
            setOpenSnack(true);
            return;
        }
        mediaRecorder.current?.addEventListener('stop', (e) => {
        })

        mediaRecorder.current?.start();

    };

    const onDataAvailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
            recordedChunks.current.push(event.data);
        }
        const audioBlob = new Blob(recordedChunks.current, { type: 'audio/wav' });
        asyncuploadAudio(audioBlob);
    };

    const stopVoiceRecording = (status: Boolean) => {
        if (status) {
            mediaRecorder.current?.addEventListener('dataavailable', onDataAvailable);
        }
        mediaRecorder.current?.stop();
        localStream?.getTracks().forEach((track) => track.stop());
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        setLocalStream(undefined);
        localStreamRef.current = undefined;
        recordedChunks.current = [];
        setIsUploadBlob(false);
    }
    async function asyncuploadAudio(file: any) {
        setDisabledButton(true);
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/message/voiceFileUpload', {
            method: 'POST',
            body: formData,
        });
        if (response.ok) {
            const res = await response.json();
            const message = {
                author: session?.user?.email,
                type: 'voiceMessage',
                content: res.filename,
                to: email,
                date: timestampToFormattedDate(Date.now()),
                time: formatTime(),
                read: false
            }
            socket.emit('sendMessage', message);
            const fetchData = async () => {
                const payload = { message: message.content }
                try {
                    await fetch('/api/message/message', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                } catch (error) {
                    console.log(error)
                }
            }
            fetchData();
            setDisabledButton(false);
        } else {
            setDisabledButton(false);
            console.error('Failed to upload file');
        }
    }

    //
    const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                    onClick={() => handleSetMessageType(true)}>
                    <Close />
                </IconButton>
                <Box sx={{ ml: 1, width: '100%', mr: 1 }}>
                    <LinearProgress variant="determinate" {...props} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                    <Typography variant="body2" color="text.secondary">
                        {`${Math.floor(props.value / 60)}`} :
                        {`${Math.floor(props.value % 60) < 10 ? `0${Math.floor(props.value % 60)}` : Math.floor(props.value % 60)}`}
                    </Typography>
                </Box>
            </Box>
        );
    }
    // voice recoding progress
    useEffect(() => {
        let progressTimer
        if (messageType) {
            setRecordingTime(0);
            clearTimeout(progressTimer);

        } else {
            if (recordingTime >= 99) {
                setMessageType(true);
                setIsUploadBlob(true);
                stopVoiceRecording(true);
            } else {
                progressTimer = setTimeout(() => {
                    setRecordingTime((prevProgress) => (prevProgress > 100 ? 1 : prevProgress + 1));
                }, 800);
            }
        }
    }, [messageType, recordingTime]);

    const getMsgs = async () => {
        const res = await fetch('/api/message/getMsgs', {
            method: 'POST',
            body: JSON.stringify({ OppositeEmail: email }),
            headers: {
                'Content-Type': 'application/json',
            }
        })
        const resData = await res.json();
        setMessages(resData.msgs);
    }

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        getMsgs();
        audio1 = new Audio(beaks[0]);
        audio2 = new Audio(beaks[1]);
        audio3 = new Audio(beaks[2]);
        audio4 = new Audio(beaks[3]);
        socket = io(String(process.env.NEXT_PUBLIC_CHAT_URI), { secure: true });
        socket.on('connect', () => {
            // Fetch existing messages from the server
            socket.emit('emailMapId', { email: session?.user?.email })
            // socket.emit('getMessages', { to: email, author: session?.user?.email });
        });
        socket.on('getid', (sockId: String) => {
            setSocketId(sockId);
        });
        socket.on('callingMe', (data: any) => {
            if (isCallingRef.current) {
                socket.emit('Iambusy', { from: data.to, to: data.from });
            } else {
                callStatusRef.current = 'callee';
                setBeingCalled(true);
                setSnackText(`${data.from} is calling you.`)
                setOpenSnack(true)
                setCallerSignal(data.signal)
                audio2.play();
                audio2.loop = true;
            }
        });
        // return () => socket.disconnect();

        // Close the dropdown if the user clicks outside of it
        window.onclick = function (event: Event) {
            // setDropDownFlag(true);
            const target = event.target as HTMLElement;
            if (!target?.matches('.dropBtn')) {
                let dropdowns = document.getElementsByClassName("reactionEmodicons");
                let dropdownsMore = document.getElementsByClassName("reactionEmodiconsMore");
                let i: number;
                for (i = 0; i < dropdowns.length; i++) {
                    let openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('showDropdownContent')) {
                        openDropdown.classList.remove('showDropdownContent');
                        dropdownsMore[i].classList.remove('showDropdownContent');
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        // socket.on('messages', (msgs: any) => {
        //     setMessages(msgs);
        // });

        socket.on('newMessage', (msg: any) => {
            if (msg.author == email || msg.author == session?.user?.email)
                setMessages((prevState) => [...prevState, msg]);
        });

        socket.on('destroyP2P', (data: any) => {
            if (callStatusRef.current == 'caller') {
                fetch('/api/message/declinedCall', {
                    method: 'POST',
                    body: JSON.stringify({ callId: callIdRef.current }),
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then((response) => response.json())
                    .then((data) => {
                        // setCallId(data.newCallInfo.insertedId);
                    })
            }
            handleCloseVideoCall(false)
        });

        // navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
        //     setLocalStream(stream);
        // }).catch((error) => {
        //     console.error("Error accessing media devices....", error)
        //     alert(error)
        // });

        socket.on('newReactEmoji', ({ msgId, emojiId }: { msgId: string, emojiId: string }) => {
            showReactedEmoji(msgId, emojiId);
        });

    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const responseData = { email: email }
            try {
                const response = await fetch('/api/user/getuser', {
                    method: 'POST',
                    body: JSON.stringify(responseData),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                const res = await response.json();
                setPic(res.data[0].picpath);
            } catch (error) {
                console.log(error);
            }
        }
        fetchData();
    }, []);

    const showReactedEmoji = (msgId: string, emojiId: string | number) => {
        const reactedMsg = document.getElementById(`reactedEmojis_${msgId}`) as HTMLElement;
        const reactedEmoji = document.getElementById(`reacted_${msgId}_${emojiId}`);
        if (reactedEmoji) {
            reactedMsg.removeChild(reactedEmoji);
        } else {
            const containerElement = document.createElement('div');
            ReactDOM.render(<EmojiChildComponent msgId={msgId} emojiId={`${emojiId}`} users={[`${session?.user?.email}`]} />, containerElement);
            if (containerElement?.firstChild) {
                reactedMsg?.appendChild(containerElement?.firstChild);
            }
        }
    }
    useEffect(() => {
        if (isUploadBlob) {
            let sendMessageBtn = document.getElementById('sendMessageBtn');
            sendMessageBtn?.click();
        }
    }, [isUploadBlob]);

    const sendMessage = async (e: any) => {
        e.preventDefault();
        if (!messageType) {
            stopVoiceRecording(true);
        } else {
            const message = {
                author: session?.user?.email,
                type: 'text',
                content: inputValue,
                to: email,
                date: timestampToFormattedDate(Date.now()),
                time: formatTime(),
                read: false
            }
            if (!message) return;
            if (inputValue.trim() == '' && messageType) return;
            socket.emit('sendMessage', message);
            const fetchData = async () => {
                const payload = { message: message.content }
                try {
                    await fetch('/api/message/message', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                } catch (error) {
                    console.log(error)
                }
            }
            fetchData();
        }

        setInputValue('');
        if (!messageType) {
            setMessageType(true);
        }
    };

    const CheckDate = (message: any, messages: any, i: number) => {
        if (messages[i - 1] === undefined) {
            return message.date
        }
        if (messages[i - 1].date == !messages.date) {
            return message.date
        }
    };

    const handleClipboardPaste = async (event: { clipboardData: { items: any; }; }) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (!blob) return;
                await asyncupload(blob);
            }
        }
    };

    async function asyncupload(file: any) {
        setDisabledButton(true);
        const data = await file.arrayBuffer();
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
            const percentCompleted = Math.round((event.loaded * 100) / event.total);
        };

        xhr.open('POST', '/api/upload');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.response)
                const message = {
                    author: session?.user?.email,
                    type: 'media',
                    filetype: response.type,
                    content: response.data,
                    to: email,
                    date: timestampToFormattedDate(Date.now()),
                    time: formatTime(),
                    read: false
                }
                socket.emit('sendMessage', message);
                setDisabledButton(false);
            } else {
                console.error('Failed to upload file');
                setDisabledButton(false);
            }
        };
        xhr.send(JSON.stringify({
            name: file.name,
            type: 'chat',
            data: Array.from(new Uint8Array(data)),
        }));
    }

    const messageElement = (type: string, content: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined, time: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | React.ReactFragment | React.ReactPortal | null | undefined, filetype: string, mine: boolean, message: any) => {
        return <div>
            {type == "media" ?
                (filetype == "image" ? <ChatImage content={content} filetype={filetype} handleClick={handleClick} />
                    : <video src={`/api/view?name=${content}`} width={160} height={90} onClick={() => handleClick(content, filetype)}></video>)
                : (type == "voiceCall" ?
                    (mine ?
                        <>
                            <Typography className={cn('msgText')} variant="body1" >{callLabel[Number(content)]}</Typography>
                            {
                                (content == 2) ? <CallMade color={'success'} fontSize="small" /> : <CallMade sx={{ color: 'red' }} fontSize="small" />
                            }
                        </>
                        :
                        <>
                            <Typography className={cn('msgText')} variant="body1" >{callLabel_[(Number(content))]}</Typography>
                            {content == 0 && <CallReceived sx={{ color: 'red' }} fontSize="small" />}
                            {content == 1 && <CallReceived sx={{ color: 'red' }} fontSize="small" />}
                            {content == 2 && <CallReceived color={'success'} fontSize="small" />}
                        </>
                    )
                    : (type === "voiceMessage" ?
                        <audio controls style={{ width: "280px", height: "48px" }} >
                            <source src={'/api/view?name=voiceMessages/' + content} type='audio/wav' />
                        </audio>
                        :
                        <Typography className={cn('msgText')} variant="body1" >{content}</Typography>
                    )
                )
            }
            <Typography sx={{ fontSize: '10px', color: '#e1e1e1' }}>{time}</Typography>
            <ContentReactedEmojis message={message} />
        </div>
    }

    useEffect(() => {
        // ...socket.io setup and message handling...
        const unreadMessages = messages.filter((item) => (item?.to === session?.user?.email && !item?.read));

        if (unreadMessages.length > 0) {
            unreadMessages.map((item) => {
                socket.emit('readMessage', { ...item, read: true })
            });
        }

        // Scroll to the bottom when new messages arrive
        if (chatWindowRef.current) {
            let chatWindow = chatWindowRef.current;
            chatWindow.scrollTop = chatWindow?.scrollHeight;
        }
    }, [messages]);

    const initiateCall = () => {
        // setIsCalling(()=>{return true});
        // setTimeout(()=> {console.log(isCalling)}, 3000)
        // navigator.mediaDevices.enumerateDevices()
        // .then(devices => {
        //     console.log(devices)
        //     const audioInputDevice = devices.find(device => device.kind === 'audioinput');
        //     const videoInputDevice = devices.find(device => device.kind === 'videoinput');

        //     // if (videoInputDevice) {
        //     //     VIDEO_CONSTRAINTS.video = {
        //     //         deviceId: {
        //     //             exact: videoInputDevice.deviceId
        //     //         }
        //     //     };
        //     // }
        // }).catch(error => {
        //     console.error('Error enumerating devices:', error);
        //     // setSnack(
        //     //   new Snack({
        //     //     message: error,
        //     //     color: 'error',
        //     //     open: true,
        //     //   })
        //     // )
        // });

        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream: any) => {
            setLocalStream(stream);
            localStreamRef.current = stream;
            audio1.play();
            audio1.loop = true;
            setIsCalling(true);
            isCallingRef.current = true
            const from = session?.user?.email;
            peer = new Peer({
                initiator: true,
                trickle: false,
                stream: localStreamRef.current,
                config: { iceServers: ICE_SERVERS }
            });
            peer.on('signal', async (signal: any) => {
                if (isCallingRef.current) {
                    socket.emit('callUser', { signal: signal, to: email, from });
                    // New Call Record
                    callStatusRef.current = 'caller';
                    const payload = {
                        to: email,
                    }
                    const res = await fetch('/api/message/newCall', {
                        method: 'POST',
                        body: JSON.stringify(payload),
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    const resData = await res.json();
                    callIdRef.current = resData.newCallInfo.insertedId;

                }
            });

            peer.on('stream', (stream: MediaStream) => {
                setRemoteStream(stream);
                remoteStreamRef.current = stream;
                myAudio.current.srcObject = stream;
            });

            peer.on('close', () => {
                handleCloseVideoCall()
                alert('opposite user ended the call.')
            });

            socket.on('acceptCall', (data: any) => {
                setCallAccepted(true);
                callStatusRef.current = 'receivedCall';
                fetch('/api/message/receivedCall', {
                    method: 'POST',
                    body: JSON.stringify({ callId: callIdRef.current }),
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                    .then((response) => response.json())
                    .then((data) => {
                        // setCallId(data.newCallInfo.insertedId);
                    })
                setSnackText(`${email} accepted your call`)
                setOpenSnack(true)
                // alert(`${email} accepted your call`)
                peer.signal(data.signal);
                audio1.pause();
                audio3.play();
            });
            socket.on('busy', (data: any) => {
                handleCloseVideoCall(false)
                setSnackText(`${data.from} is busy now.`)
                setOpenSnack(true)
            })
            connection.current = peer;
        }).catch((error) => {
            console.error("Error accessing media devices....", error)
            // alert(error)
            setSnackText(`${error}`)
            setOpenSnack(true)
        });
    };

    const acceptCall = () => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream: any) => {
            setLocalStream(stream);
            localStreamRef.current = stream;
            setCallAccepted(true);
            audio2.pause();
            audio3.play();
            peer = new Peer({
                initiator: false,
                trickle: false,
                stream: localStreamRef.current,
            });
            const from = session?.user?.email
            peer.on("signal", (signal: any) => {
                socket.emit("acceptCall", { signal: signal, to: email, from });
            });
            peer.on("stream", (stream: any) => {
                setRemoteStream(stream);
                remoteStreamRef.current = stream;
                myAudio.current.srcObject = stream;
            });

            peer.on('close', () => {
                handleCloseVideoCall()
                alert('opposite user ended the call.')
            });

            if (callerSignal) peer.signal(callerSignal);
            connection.current = peer;

        }).catch((error) => {
            console.error("Error accessing media devices....", error)
            // alert(error)
            setSnackText(`${error}`)
            setOpenSnack(true)
        });
    }

    const handleCloseVideoCall = (flag: Boolean = true) => {
        localStream?.getTracks().forEach((track) => track.stop());
        remoteStream?.getTracks().forEach((track) => track.stop());
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
        audio1.pause();
        audio2.pause();
        audio4.play();
        localStream?.getAudioTracks()[0].stop();
        remoteStream?.getAudioTracks()[0].stop();
        localStreamRef.current?.getAudioTracks()[0].stop();
        remoteStreamRef.current?.getAudioTracks()[0].stop();
        localStreamRef.current = undefined;
        remoteStreamRef.current = undefined;
        setLocalStream(undefined);
        setRemoteStream(undefined);
        setIsCalling(false);
        setMinimizeCall(false);
        isCallingRef.current = false
        setCallAccepted(false);
        setBeingCalled(false);
        if (callStatusRef.current) {
            getMsgs();
        }
        if (callStatusRef.current == 'caller') {
            socket.emit('missedCall', { to: email });
        }
        callStatusRef.current = undefined;
        if (flag) {
            const from = session?.user?.email
            socket.emit('destroyP2P', { to: email, from });
        }
        // peer.destroy();
    };

    const handleCloseSnack = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackText('')
        setOpenSnack(false);
    };

    const handleReactionDropdown = (index: number) => {
        // let reactDropdown = reactDropdownRef.current;
        // if (dropdownFlag) {
        const element = document.getElementById(`reactDropdownContent-${index}`);
        if (element) {
            let dropdowns = document.getElementsByClassName("reactionEmodicons");
            let dropdownsMore = document.getElementsByClassName("reactionEmodiconsMore");
            let i: number;
            for (i = 0; i < dropdowns.length; i++) {
                let openDropdown = dropdowns[i];
                if (`${openDropdown.id}` === `reactDropdownContent-${index}`) continue;
                if (openDropdown.classList.contains('showDropdownContent')) {
                    openDropdown.classList.remove('showDropdownContent');
                    dropdownsMore[i].classList.remove('showDropdownContent');
                }
            }
            element.classList.toggle("showDropdownContent");
        }
        // }
        // setDropDownFlag((prevState) => !prevState);
    }

    const reactEmoji = async (msgId: string, emojiId: number) => {
        const res = await fetch('/api/message/reactEmoji', {
            method: 'POST',
            body: JSON.stringify({
                msgId: msgId,
                emojiId: emojiId
            }),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const resData = await res.json();
        showReactedEmoji(msgId, emojiId);
        socket.emit('reactEmoji', { msgId, emojiId, to: email });
        // if (resData.message == 'success') {
        //     showReactedEmoji(msgId, emojiId);
        //     socket.emit('reactEmoji', { msgId, emojiId, to: email });
        // }
    }

    const reactEmojiMore = (index: number) => {
        const element = document.getElementById(`reactDropdownContentMore-${index}`);
        // let dropdowns = document.getElementsByClassName("reactionEmodiconsMore");
        // let i: number;
        // for (i = 0; i < dropdowns.length; i++) {
        //     let openDropdown = dropdowns[i];
        //     if (openDropdown.classList.contains('showDropdownContent')) {
        //         openDropdown.classList.remove('showDropdownContent');
        //     }
        // }
        // console.log(element)
        element?.classList.toggle("showDropdownContent");
    }

    const action = (
        <React.Fragment>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnack}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    return (
        <StyledEngineProvider injectFirst>
            <CacheProvider value={cache}>
                <IsCallingContext.Provider value={isCalling}>
                    <FullLayout title="Chat" appbar={false}>
                        <Box
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                            <Box
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    width: '100vw',
                                    background: '#3339',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}>
                                <Box
                                    sx={{
                                        background: 'rgb(47,255,79)',
                                        borderRadius: 2,
                                        width: 70,
                                        height: 70,
                                        // padding: 1,
                                    }}>
                                    <Image src={(pic == "" || pic == undefined) ? `/images/male.png` : `/avatars/${pic}`} alt="male" width={70} height={70} />
                                </Box>
                                <Typography sx={{ flexGrow: 1 }}>{email}</Typography>

                                <IconButton
                                    size="large"
                                    edge="end"
                                    color="inherit"
                                    aria-label="menu"
                                    onClick={router.back}
                                    LinkComponent={Link}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                            </Box>
                            <Stack
                                ref={chatWindowRef}
                                sx={{
                                    flex: 1,
                                    overflowY: 'scroll',
                                    p: 1
                                }}>
                                {messages.map((message, i) => (
                                    <Fragment key={i}>
                                        <Typography alignSelf={'center'} sx={{ color: '#e1e1e1' }}>{CheckDate(message, messages, i)}</Typography>
                                        {
                                            (message.author != session?.user?.email) ?
                                                <Stack direction="row" sx={{ maxWidth: '80%' }}>
                                                    <Box
                                                        alignSelf={'start'}
                                                        bgcolor="#292929"
                                                        sx={{ borderRadius: 2, p: 1, px: 2, m: 1, maxWidth: '80%' }}>
                                                        {/* <Typography>{typeof message._id}</Typography>
                                            <Typography sx={{fontSize:'10px'}}>{message.time}</Typography> */}
                                                        {messageElement(message?.type, message?.content, message?.time, message.filetype, false, message)}
                                                    </Box>
                                                    <Box mt={1} className={cn(styles.reactionDropdown)}>
                                                        <Stack className={cn(styles.reactionEmodicons, 'reactionEmodicons')} id={`reactDropdownContent-${i}`} direction="row" spacing={2}>
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 3333)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/3333.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 4444)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/4444.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 5555)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/5555.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 6666)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/6666.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 7777)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/7777.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 8888)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/8888.png" />
                                                            <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 9999)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/9999.png" />
                                                            <MoreHoriz className="dropBtn" sx={{ width: '20px', height: '20px', cursor: 'pointer' }} onClick={() => reactEmojiMore(i)} />
                                                        </Stack>
                                                        <Grid className={cn(styles.reactionEmodiconsMore, 'reactionEmodiconsMore')} id={`reactDropdownContentMore-${i}`} container spacing={2} columns={7}>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 333)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/333.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 444)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/444.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 555)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/555.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 666)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/666.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 777)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/777.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 888)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/888.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 999)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/999.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 33)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/33.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 44)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/44.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 55)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/55.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 66)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/66.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 77)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/77.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 88)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/88.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 99)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/99.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 3)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/3.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 4)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/4.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 5)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/5.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 6)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/6.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 7)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/7.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 8)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/8.png" />
                                                            </Grid>
                                                            <Grid item xs={1} md={1}>
                                                                <Avatar alt="emodicon" onClick={() => reactEmoji(message._id, 9)} className={cn(styles.reactionEmodicon)} src="/images/emodicons/reaction/9.png" />
                                                            </Grid>
                                                        </Grid>
                                                        <svg cursor='pointer' onClick={() => handleReactionDropdown(i)} className={cn(styles.reactionDropBtn, 'dropBtn')} width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#8A8D91" gradientcolor1="#8A8D91" gradientcolor2="#8A8D91"><path d="M12 1.999c5.524 0 10.002 4.478 10.002 10.002 0 5.523-4.478 10.001-10.002 10.001-5.524 0-10.002-4.478-10.002-10.001C1.998 6.477 6.476 1.998 12 1.998Zm0 1.5a8.502 8.502 0 1 0 0 17.003A8.502 8.502 0 0 0 12 3.5ZM8.462 14.784A4.491 4.491 0 0 0 12 16.502a4.491 4.491 0 0 0 3.535-1.714.75.75 0 0 1 1.177.93A5.991 5.991 0 0 1 12 18.002a5.991 5.991 0 0 1-4.716-2.29.75.75 0 0 1 1.178-.928ZM9 8.75a1.25 1.25 0 1 1 0 2.499A1.25 1.25 0 0 1 9 8.75Zm6 0a1.25 1.25 0 1 1 0 2.499 1.25 1.25 0 0 1 0-2.499Z"></path></svg>
                                                    </Box>
                                                </Stack> :
                                                <Box
                                                    alignSelf={'end'}
                                                    textAlign="right"
                                                    bgcolor="#0e3b82"
                                                    sx={{ borderRadius: 2, p: 1, px: 2, m: 1, maxWidth: '80%' }}>
                                                    {messageElement(message?.type, message?.content, message?.time, message.filetype, true, message)}
                                                </Box>
                                        }
                                    </Fragment>
                                ))}
                            </Stack>
                            <Box
                                sx={{
                                    width: '100vw',
                                    display: 'flex',
                                    p: 2,
                                }}>
                                {
                                    messageType ? (
                                        <TextField
                                            value={inputValue}
                                            sx={{ flexGrow: 1 }}
                                            variant="standard"
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onPaste={handleClipboardPaste}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    sendMessage(e)
                                                }
                                            }} />
                                    ) : (
                                        <Box
                                            sx={{
                                                flexGrow: 1,
                                                borderRadius: "20px",
                                                bgcolor: 'info.main',
                                                padding: "0px 20px"
                                            }}
                                        >
                                            <LinearProgressWithLabel value={recordingTime} color="inherit" />
                                        </Box>
                                    )
                                }
                                <IconButton
                                    sx={{
                                        bgcolor: 'info.main',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        ml: 2,
                                    }}
                                    disabled={disabledButton}
                                    id="sendMessageBtn"
                                    onClick={(e) => sendMessage(e)}>
                                    <Send />
                                </IconButton>
                                {
                                    messageType ? (
                                        <IconButton
                                            sx={{
                                                bgcolor: 'info.main',
                                                borderRadius: '50%',
                                                width: 40,
                                                height: 40,
                                                ml: 2,
                                            }}
                                            disabled={disabledButton}
                                            onClick={() => handleMediaRecorderInit()}
                                        >
                                            <MicIcon />
                                        </IconButton>
                                    ) : (
                                        <IconButton
                                            sx={{
                                                bgcolor: 'info.main',
                                                borderRadius: '50%',
                                                width: 40,
                                                height: 40,
                                                ml: 2,
                                            }}
                                            disabled={disabledButton}
                                            onClick={() => handleSetMessageType(true)}
                                        >
                                            <MailIcon />
                                        </IconButton>
                                    )
                                }
                                <IconButton
                                    sx={{
                                        bgcolor: 'info.main',
                                        borderRadius: '50%',
                                        width: 40,
                                        height: 40,
                                        ml: 1,
                                    }}
                                    disabled={disabledButton}
                                    >
                                    <label htmlFor="icon-button-file">
                                        <AttachFileIcon />
                                    </label>
                                    <input
                                        accept="*.jpg,.jpeg,.png,.gif,.bmp,.mp4,.mov,.avi*"
                                        id="icon-button-file"
                                        type="file"
                                        onChange={(e) => asyncupload(e.target.files[0])}
                                        style={{ display: 'none' }} />
                                </IconButton>
                                <CallButton onClick={initiateCall} isCalling={isCalling} beingCalled={beingCalled} minimizeCall={minimizeCall} setMiniCall={(value: boolean) => { setMinimizeCall(value) }} />
                            </Box>
                            {(isCalling || beingCalled) && (
                                !minimizeCall &&
                                <VideoCallWindow
                                    pic={pic}
                                    localStream={localStream}
                                    remoteStream={remoteStream}
                                    callAccepted={callAccepted}
                                    videoWindowClosed={handleCloseVideoCall}
                                    acceptCall={acceptCall}
                                    minimize={(val: boolean) => { setMinimizeCall(val) }}
                                />
                            )}
                        </Box>
                        <MediaViewer
                            open={open}
                            handleClose={handleClose}
                            content={selectedContent}
                        />
                        <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={openSnack} autoHideDuration={6000} onClose={handleCloseSnack}>
                            <Alert onClose={handleCloseSnack} severity="success" sx={{ width: '100%' }}>
                                {snackText}
                            </Alert>
                        </Snackbar>

                        {callAccepted ? (
                            <audio
                                playsInline
                                ref={myAudio}
                                autoPlay
                                hidden
                            />
                        ) : null}

                    </FullLayout>
                </IsCallingContext.Provider>

            </CacheProvider>
        </StyledEngineProvider>
    )
}

export function MediaViewer({ open, handleClose, content }: MediaViewerProps) {
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

export function ChatImage({ content, filetype, handleClick }: any) {
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
        width: 0,
        height: 0,
    });

    const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const img = event.currentTarget;
        const tempImage = document.createElement("img") as HTMLImageElement;
        tempImage.crossOrigin = 'anonymous';

        tempImage.onload = () => {
            setImageDimensions({ width: tempImage.width * 10, height: tempImage.height * 10 });
            URL.revokeObjectURL(img.src);  // Release memory
        };

        // Assign the src after the onload is attached
        tempImage.src = img.src;
    };

    return (
        <div>
            <Image
                src={`/api/view?name=chats/${content}`}
                alt={content}
                width={imageDimensions.width > 200 ? 200 : imageDimensions.width}
                height={imageDimensions.height > 300 ? 300 : imageDimensions.height}
                onClick={() => handleClick(content, filetype)}
                onLoad={handleImageLoad}    
            />
        </div>
    )
}

export async function getServerSideProps({ req }: { req: NextApiRequest }) {
    const session = await getSession({
        req,
    })

    if (!session) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        }
    }

    return {
        props: {
            session,
        },
    }
}

interface CallButtonProps {
    onClick: () => void;
    isCalling: boolean;
    beingCalled: boolean;
    minimizeCall: boolean;
    setMiniCall: (value: boolean) => void;
}

const CallButton: React.FC<CallButtonProps> = ({ onClick, isCalling, beingCalled, minimizeCall, setMiniCall }) => {
    return (
        <>
            {minimizeCall ? (
                <IconButton sx={{ bgcolor: 'primary.main', borderRadius: '50%', width: 40, height: 40, ml: 2 }} onClick={() => setMiniCall(false)}>
                    <PhoneInTalk />
                </IconButton>
            ) : (
                <IconButton sx={{ bgcolor: 'primary.main', borderRadius: '50%', width: 40, height: 40, ml: 2 }} onClick={onClick}>
                    {isCalling || beingCalled ? <PhoneDisabled /> : <Phone />}
                </IconButton>
            )}
        </>
    );
};

const VideoCallWindow = ({ pic, localStream, remoteStream, videoWindowClosed, acceptCall, callAccepted, minimize }: any) => {
    // const localVideoRef = useRef<HTMLVideoElement>(null);
    // const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // useEffect(() => {
    //     if (localStream && localVideoRef.current) {
    //         localVideoRef.current.srcObject = localStream;
    //     }
    // }, [localStream]);

    // useEffect(() => {
    //     if (remoteStream && remoteVideoRef.current) {
    //         remoteVideoRef.current.srcObject = remoteStream;
    //     }
    // }, [remoteStream]);
    const isCalling = useContext(IsCallingContext);

    const onCallEnd = () => {
        videoWindowClosed()
    }
    const answerCall = () => {
        acceptCall()
    }

    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 1000,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
            {/* <video
                ref={localVideoRef}
                muted
                autoPlay
                playsInline
                style={{
                    width: '180px',
                    height: '135px',
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '2px solid white',
                }}>
            </video> */}
            <div
                style={{
                    width: '640px',
                    height: '480px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '2px solid #312f41',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#18151c'
                }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'Center',
                    flexGrow: 1,
                }}>
                    <Image style={{
                        alignSelf: 'center',
                        border: '1px solid #6e6a91',
                        borderRadius: '50%',
                        width: '240px',
                        height: '240px',
                        padding: '4px'
                    }}
                        src={(pic == "" || pic == undefined) ? `/images/male.png` : `/avatars/${pic}`} alt="male" width={70} height={70} />
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'Center'
                }}>
                    {
                        (!callAccepted && !isCalling) &&
                        (<Fab style={{ backgroundColor: 'green', marginRight: '25px' }} aria-label="add">
                            <PhoneEnabled onClick={answerCall} sx={{ color: 'white', fontSize: '45px' }} />
                        </Fab>)
                    }
                    <Fab style={{ backgroundColor: '#af0000' }} aria-label="add">
                        <CallEnd onClick={onCallEnd} sx={{ color: 'white', fontSize: '45px' }} />
                    </Fab>

                </div>
                <div style={{ marginTop: '20px' }}>
                    {
                        callAccepted || (<LinearProgress color="success" />)
                    }
                </div>
            </div>
            <Stack direction="row" style={{
                position: 'absolute',
                cursor: 'pointer',
                top: '10px',
                right: '10px',
                color: 'white',
            }}>
                <Minimize onClick={() => minimize(true)} sx={{ fontSize: '32px' }} />
                <Close onClick={videoWindowClosed} sx={{ fontSize: '32px' }} />
            </Stack>
        </div>
    );
};