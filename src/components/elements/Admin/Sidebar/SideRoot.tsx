import { Drawer } from "@mui/material";
import { styled } from "@mui/material/styles";

interface StyledDrawerProps {
    ownerState: any;
}

export default styled(Drawer)<StyledDrawerProps>(({theme, ownerState}) => {
    const {palette, breakpoints} = theme

    const drawerOpenStyles = () => ({
        // background: backgroundValue,
        transform: "translateX(0)",
        // transition: transitions.create("transform", {
        //   easing: transitions.easing.sharp,
        //   duration: transitions.duration.shorter,
        // }),
    
        [breakpoints.up("xl")]: {
        //   boxShadow: transparentSidenav ? "none" : xxl,
        //   marginBottom: transparentSidenav ? 0 : "inherit",
          left: "0",
        //   width: sidebarWidth,
          transform: "translateX(0)",
        //   transition: transitions.create(["width", "background-color"], {
        //     easing: transitions.easing.sharp,
        //     duration: transitions.duration.enteringScreen,
        //   }),
        },
      });
      
  return {
    '& .MuiDrawer-paper': {
        boxShadow: '0rem 1.25rem 1.6875rem 0rem rgba(0, 0, 0, 0.05)',
        border: 'none',
        ...drawerOpenStyles
    }
  }  
})