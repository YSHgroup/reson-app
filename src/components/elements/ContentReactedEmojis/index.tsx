import { useEffect, useState, useCallback, type ReactElement } from "react";
import { Stack, Avatar } from '@mui/material'
import cn from 'classnames';
import styles from '../../../styles/chat.module.scss';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

interface Props {
    message: any;
}

interface EmojiChildProps {
    msgId: string;
    emojiId: string;
    users: string[];
}

const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
        color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: theme.palette.common.black,
    },
}));

export const EmojiChildComponent: React.FC<EmojiChildProps> = ({msgId, emojiId, users}) => {
    return (
        <BootstrapTooltip title={users} placement="top">
            <Avatar alt="emodicon" id={`reacted_${msgId}_${emojiId}`} src={`/images/emodicons/reaction/${emojiId}.png`} />
        </BootstrapTooltip>
    );
};

export const ContentReactedEmojis: React.FC<Props> = ({ message }) => {
    const [childEmojiComponents, setChildEmojiComponents] = useState<ReactElement[]>([]);
    // const [reactedUserNames, setReactedUserNames] = useState<any[]>([]);

    useEffect(() => {
        // const fetchUserNames = async () => {
        //     const res = await fetch('/api/message/getReactedUsers', {
        //         method: 'POST',
        //         body: JSON.stringify({userEmails: }),
        //         headers: {
        //             'Content-Type': 'application/json',
        //         }
        //     })
        //     const resData = await res.json();
        // }
        message.reactEmoji && Object.entries(message.reactEmoji).map((item: any, index: number)=> {
            if (`${item[1]}`.trim()) {
                const newEmojiChildComponent = <EmojiChildComponent msgId={message._id} emojiId={`${item[0]}`} users={item[1]} key={`${message._id}_${index}`} />
                setChildEmojiComponents(prevState => [...prevState, newEmojiChildComponent]);
            }
        })
    }, [])

    return (
        <Stack direction="row" className={cn(styles.reactedEmojis, 'reactedEmojis')} id={`reactedEmojis_${message._id}`} spacing={2}>
            { childEmojiComponents }
            {/* <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_4444`} src="/images/emodicons/reaction/4444.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_5555`} src="/images/emodicons/reaction/5555.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_6666`} src="/images/emodicons/reaction/6666.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_7777`} src="/images/emodicons/reaction/7777.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_8888`} src="/images/emodicons/reaction/8888.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_9999`} src="/images/emodicons/reaction/9999.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_333`} onClick={() => { }} className={''} src="/images/emodicons/reaction/333.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_444`} onClick={() => { }} className={''} src="/images/emodicons/reaction/444.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_555`} onClick={() => { }} className={''} src="/images/emodicons/reaction/555.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_666`} onClick={() => { }} className={''} src="/images/emodicons/reaction/666.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_777`} onClick={() => { }} className={''} src="/images/emodicons/reaction/777.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_888`} onClick={() => { }} className={''} src="/images/emodicons/reaction/888.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_999`} onClick={() => { }} className={''} src="/images/emodicons/reaction/999.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_33`} onClick={() => { }} className={''} src="/images/emodicons/reaction/33.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_44`} onClick={() => { }} className={''} src="/images/emodicons/reaction/44.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_55`} onClick={() => { }} className={''} src="/images/emodicons/reaction/55.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_66`} onClick={() => { }} className={''} src="/images/emodicons/reaction/66.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_77`} onClick={() => { }} className={''} src="/images/emodicons/reaction/77.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_88`} onClick={() => { }} className={''} src="/images/emodicons/reaction/88.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_99`} onClick={() => { }} className={''} src="/images/emodicons/reaction/99.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_3`} onClick={() => { }} className={''} src="/images/emodicons/reaction/3.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_4`} onClick={() => { }} className={''} src="/images/emodicons/reaction/4.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_5`} onClick={() => { }} className={''} src="/images/emodicons/reaction/5.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_6`} onClick={() => { }} className={''} src="/images/emodicons/reaction/6.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_7`} onClick={() => { }} className={''} src="/images/emodicons/reaction/7.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_8`} onClick={() => { }} className={''} src="/images/emodicons/reaction/8.png" />
            </BootstrapTooltip>
            <BootstrapTooltip title="hans, kosmos, kirill" placement="top">
                <Avatar alt="emodicon" id={`reacted_${message._id}_9`} onClick={() => { }} className={''} src="/images/emodicons/reaction/9.png" />
            </BootstrapTooltip> */}
        </Stack>
    )
}