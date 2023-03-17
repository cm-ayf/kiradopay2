import React, { useRef } from "react";
import { AppBar, AppBarProps, Toolbar, Typography } from "@mui/material";

type NavigationProps = {
  title?: string;
} & AppBarProps;

const Navigation: React.FC<NavigationProps> = ({
  children,
  title,
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
