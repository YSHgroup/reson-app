import { useState, useRef } from 'react';

export const useCallAccepted = () => {
    const [callAccepted, setCallAccepted] = useState(false);
    return { callAccepted, setCallAccepted };
};

export const usePic = () => {
    const [pic, setPic] = useState("");
    return { pic, setPic };
}

export const useIsCalling = () => {
    const [isCalling, setIsCalling] = useState<boolean>(false);
    return { isCalling, setIsCalling }
}

export const useBeingCalled = () => {
    const [beingCalled, setBeingCalled] = useState(false);
    return { beingCalled, setBeingCalled }
}

export const useMessages = () => {
    const [messages, setMessages] = useState<Array<any>>([])
    return { messages, setMessages }
}

export const useRemoteStream = () => {
    const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>(
        undefined
    )
    return { remoteStream, setRemoteStream }
}

export const useLocalStream = () => {
    const [localStream, setLocalStream] = useState<MediaStream | undefined>(
        undefined
    );
    return { localStream, setLocalStream }
}
export const useMinimizeCall = () => {
    const [minimizeCall, setMinimizeCall] = useState<boolean>(false)
    return { minimizeCall, setMinimizeCall }
}
export const useCallerSignal = () => {
    const [callerSignal, setCallerSignal] = useState(null)
    return { callerSignal, setCallerSignal }
}
export const useOpenSnack = () => {
    const [openSnack, setOpenSnack] = useState(false)
    return { openSnack, setOpenSnack }
}
export const useSnackText = () => {
    const [snackText, setSnackText] = useState('')
    return { snackText, setSnackText }
}

export const useLocalStreamRef = () => {
    const localStreamRef = useRef<MediaStream | undefined>(undefined);
    return localStreamRef;
}

export const useRemoteStreamRef = () => {
    const remoteStreamRef = useRef<MediaStream | undefined>(undefined)
    return remoteStreamRef;
}

export const useMyAudio = () => {
    const myAudio = useRef<any>(null)
    return myAudio;
}

export const useConnection = () => {
    const connection = useRef();
    return connection;
}
export const useCallStatusRef = () => {
    const callStatusRef = useRef<any>(undefined)
    return callStatusRef;
}
export const useIsCallingRef = () => {
    const isCallingRef = useRef(false)
    return isCallingRef;
}