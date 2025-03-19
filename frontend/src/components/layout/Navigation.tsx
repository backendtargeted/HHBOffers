import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

// Import auth context
import { AuthContext } from '../../App';

interface NavigationProps {
  title?: string;
}

const Navigation: React.FC<NavigationProps> = ({ title = 'Direct Mail Offers' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    if (authContext) {
      await authContext.logout();
      navigate('/login');
    }
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Check if user has required role
  const hasRole = (requiredRoles: string[]) => {
    if (!authContext || !authContext.user) return false;
    return requiredRoles.includes(authContext.user.role) || authContext.user.role === 'admin';
  };

  // Get first letter of user name for avatar
  const getUserInitial = () => {
    if (!authContext || !authContext.user) return 'U';
    return authContext.user.name.charAt(0).toUpperCase();
  };

  // Check if path is active
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

          {authContext && authContext.isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {getUserInitial()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {authContext.user?.name}
                  </Typography>
                </MenuItem>
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    {authContext.user?.role}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            <ListItem
              component="button" // Keep this
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
            </ListItem>

            <ListItem
              component="button" // Keep this
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
            </ListItem>

            {hasRole(['admin', 'manager']) && (
              <ListItem
                component="button" // Keep this
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
              </ListItem>
            )}
          </List>

          <Divider />

          <List>
            <ListItem
              component="button" // Keep this
              onClick={handleLogout}
            >
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navigation;
