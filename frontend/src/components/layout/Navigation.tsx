import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

interface NavigationProps {
  title?: string;
}

const Navigation: React.FC<NavigationProps> = ({ title = 'Direct Mail Offers' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItemButton
              onClick={() => handleNavigation('/dashboard')}
              sx={{
                backgroundColor: isActive('/dashboard') ? 'action.selected' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive('/dashboard') ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <DashboardIcon color={isActive('/dashboard') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNavigation('/search')}
              sx={{
                backgroundColor: isActive('/search') ? 'action.selected' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive('/search') ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <SearchIcon color={isActive('/search') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Search Properties" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNavigation('/upload')}
              sx={{
                backgroundColor: isActive('/upload') ? 'action.selected' : 'inherit',
                '&:hover': {
                  backgroundColor: isActive('/upload') ? 'action.selected' : 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <UploadIcon color={isActive('/upload') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Upload Data" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;