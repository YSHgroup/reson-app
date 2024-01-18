import { DrawerClasses, Theme } from "@mui/material";
import { DrawerProps, } from "@mui/material";
import { OverridesStyleRules } from "@mui/material/styles/overrides";

const sidenav: {styleOverrides: Partial<OverridesStyleRules<keyof DrawerClasses, "MuiDrawer", Omit<Theme, "components">>>} = {
    styleOverrides: {
      root: {
        width: '250px',
        whiteSpace: "nowrap",
        border: "none",
      },
  
      paper: {
        width: '250px',
        // backgroundColor: '',
        height: `calc(100vh - 2rem)`,
        margin: '1rem',
        borderRadius: '.5rem',
        border: "none",
      },
  
      paperAnchorDockedLeft: {
        borderRight: "none",
      },
    },
  };
  
  export {sidenav};