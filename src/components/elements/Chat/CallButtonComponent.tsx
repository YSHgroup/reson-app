import React from "react";
import { Phone, PhoneDisabled, PhoneInTalk } from '@mui/icons-material'
import { IconButton } from '@mui/material'

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

export default CallButton