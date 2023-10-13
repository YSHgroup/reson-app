import React, { Fragment, useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography, Avatar, Grid } from '@mui/material'
import { AttachFile as AttachFileIcon, Close, Minimize, Mail as MailIcon, Send, Mic as MicIcon, Phone, PhoneDisabled, CallEnd, PhoneEnabled, PhoneInTalk, CallReceived, CallMade, MoreHoriz, Padding, Flag } from '@mui/icons-material'
import Image from 'next/image'
import Fab from '@mui/material/Fab';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import IsCallingContext from "context/IsCallingContext";


interface CallButtonProps {
    onClick: () => void;
    isCalling: boolean;
    beingCalled: boolean;
    minimizeCall: boolean;
    setMiniCall: (value: boolean) => void;
}

export const CallButton: React.FC<CallButtonProps> = ({ onClick, isCalling, beingCalled, minimizeCall, setMiniCall }) => {
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

export const VideoCallWindow = ({ pic, localStream, remoteStream, videoWindowClosed, acceptCall, callAccepted, minimize }: any) => {
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
                        src={(pic == "" || pic == undefined) ? `/images/male.png` : `/api/view?name=chats/${pic}`} alt="male" width={70} height={70} />
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