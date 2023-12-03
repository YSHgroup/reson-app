import { createTheme } from "@mui/material";

export const darkTheme  = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#002060',
        },
        secondary: {
            main: '#5670A2'
        },
        background: {
            default: '#5670A2',
            paper: '#002060'
        },
        text: {
            primary: '#fff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        divider: "rgba(255,255,255,0.12)"

    }
})

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0B635D'
        },
        secondary: {
            main: '#58E7FF'
        },
        background: {
            default: '#58E7FF',
            paper: '#0B635D'
        },
        text: {
            primary: '#fff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        divider: "rgba(255,255,255,0.12)",
    }
})