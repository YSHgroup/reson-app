import { createTheme } from "@mui/material";

export const defaultTheme  = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#5284e8',
            100: '#5284e877',
            200: '#5284e8aa',
        },
        secondary: {
            main: '#4e96ba'
        },
        background: {
            default: '#4e96ba',
            paper: '#002060'
        },
        text: {
            primary: '#fff',
            secondary: 'rgba(255, 255, 255, 0.7)',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        divider: "rgba(255,255,255,0.2)"

    },
})

export const darkTheme  = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#5284e8',
            100: '#5284e877',
            200: '#5284e8aa',
        },
        secondary: {
            main: '#5670A2',
            light: '#c6d4f1'
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
        divider: "rgba(255,255,255,0.2)"

    },
})

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#88e2ec',
            light: '#c1ebef',
            100: '#88e2ec77',
            200: '#88e2ecaa',
        },
        secondary: {
            main: '#fff'
        },
        background: {
            default: '#58E7FF',
            paper: '#88e2ec'
        },
        text: {
            primary: '#222222bb',
            secondary: '#22222299',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        divider: "rgba(255,255,255,0.2)",
    },
})