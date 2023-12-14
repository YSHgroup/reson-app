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
    // components: {
    //     MuiTextField: {
    //       styleOverrides: {
    //         root: {
    //           // Apply a border color for text fields
    //           '& .MuiOutlinedInput-notchedOutline': {
    //             borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //           },
    //           '& .css-qzbt6i-MuiButtonBase-root-MuiIconButton-root-MuiAutocomplete-popupIndicator': {
    //             color: 'rgba(220, 220, 220, 0.73)', // Example gray border
    //           },
    //           '& .css-i4bv87-MuiSvgIcon-root': {
    //             color: 'rgba(220, 220, 220, 0.73)'
    //           }
    //         },
    //       },
    //     },
    //     MuiSelect: {
    //         styleOverrides: {
    //           root: {
    //             // Apply a border color for text fields
    //             '& .MuiOutlinedInput-notchedOutline': {
    //               borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //             },
    //             '& .css-10d36jd-MuiSvgIcon-root-MuiSelect-icon': {
    //                 color: '#fff'
    //             }
    //           },
    //         },
    //       },
    // }
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
        divider: "rgba(255,255,255,0.2)"

    },
    // components: {
    //     MuiTextField: {
    //       styleOverrides: {
    //         root: {
    //           // Apply a border color for text fields
    //           '& .MuiOutlinedInput-notchedOutline': {
    //             borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //           },
    //           '& .css-qzbt6i-MuiButtonBase-root-MuiIconButton-root-MuiAutocomplete-popupIndicator': {
    //             color: 'rgba(220, 220, 220, 0.73)', // Example gray border
    //           },
    //           '& .css-i4bv87-MuiSvgIcon-root': {
    //             color: 'rgba(220, 220, 220, 0.73)'
    //           }
    //         },
    //       },
    //     },
    //     MuiSelect: {
    //         styleOverrides: {
    //           root: {
    //             // Apply a border color for text fields
    //             '& .MuiOutlinedInput-notchedOutline': {
    //               borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //             },
    //             '& .css-10d36jd-MuiSvgIcon-root-MuiSelect-icon': {
    //                 color: '#fff'
    //             }
    //           },
    //         },
    //       },
    // }
})

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#88e2ec',
            100: '#88e2ec77',
            200: '#88e2ecaa',
            // main: '#0B635D'
        },
        secondary: {
            main: '#fff'
        },
        background: {
            default: '#58E7FF',
            paper: '#88e2ec'
        },
        text: {
            primary: '#222222aa',
            secondary: '#22222288',
            disabled: 'rgba(255, 255, 255, 0.5)',
        },
        divider: "rgba(255,255,255,0.2)",
    },
    // components: {
    //     MuiTextField: {
    //       styleOverrides: {
    //         root: {
    //           // Apply a border color for text fields
    //           '& .MuiOutlinedInput-notchedOutline': {
    //             borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //           },
    //           '& .css-qzbt6i-MuiButtonBase-root-MuiIconButton-root-MuiAutocomplete-popupIndicator': {
    //             color: 'rgba(220, 220, 220, 0.73)', // Example gray border
    //           },
    //           '& .css-i4bv87-MuiSvgIcon-root': {
    //             color: 'rgba(220, 220, 220, 0.73)'
    //           }
    //         },
    //       },
    //     },
    //     MuiSelect: {
    //         styleOverrides: {
    //           root: {
    //             // Apply a border color for text fields
    //             '& .MuiOutlinedInput-notchedOutline': {
    //               borderColor: 'rgba(220, 220, 220, 0.23)', // Example gray border
    //             },
    //             '& .css-10d36jd-MuiSvgIcon-root-MuiSelect-icon': {
    //                 color: '#fff'
    //             }
    //           },
    //         },
    //       },
    // }
})