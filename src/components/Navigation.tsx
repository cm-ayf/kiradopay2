import React, { useRef } from "react";
import { AppBar, AppBarProps, Toolbar, Typography } from "@mui/material";

type NavigationProps = {
  title?: string;
  menuItems: MenuItems;
} & AppBarProps;

export type MenuItems = {
  href: string;
  textContent: string;
}[];

const Navigation: React.FC<NavigationProps> = ({
  children,
  title,
  menuItems,
  ...props
}) => {
  const anchorEl = useRef(null);

  return (
    <AppBar position="static" {...props}>
      <Toolbar variant="dense" ref={anchorEl}>
        <Typography component="h1" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
