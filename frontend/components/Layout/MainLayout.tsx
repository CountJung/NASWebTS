'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { styled, useTheme, useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FolderIcon from '@mui/icons-material/Folder';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';
import useMediaQuery from '@mui/material/useMediaQuery';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';
import ArticleIcon from '@mui/icons-material/Article';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

const drawerWidth = 240;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, setMode } = useColorScheme();
  const { user, loading, login, logout } = useAuth();
  
  // Theme Menu State
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  // User Menu State
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(userMenuAnchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleModeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    handleMenuClose();
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const handleSettings = () => {
    handleUserMenuClose();
    router.push('/settings');
  };

  const handleLogs = () => {
    handleUserMenuClose();
    router.push('/admin/logs');
  };

  const getIcon = () => {
    if (mode === 'dark') return <Brightness4Icon />;
    if (mode === 'light') return <Brightness7Icon />;
    return <SettingsBrightnessIcon />;
  };

  const menuItems = [
    { text: 'Files', icon: <FolderIcon />, path: '/' },
    { text: 'Recent', icon: <AccessTimeIcon />, path: '/recent' },
    { text: 'Trash', icon: <DeleteIcon />, path: '/trash' },
  ];

  const publicPaths = ['/login', '/auth/callback'];

  React.useEffect(() => {
    if (loading) return;

    if (user?.role === UserRole.BANNED) {
      logout('/login?error=banned');
      return;
    }

    const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!user && !isPublic) {
      logout(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
    }
  }, [loading, user, pathname, logout]);

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Web NAS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={pathname === item.path}
              onClick={() => {
                router.push(item.path);
                if (!isDesktop) setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          
          <Tooltip title="Theme Settings">
            <IconButton onClick={handleMenuClick} color="inherit">
              {getIcon()}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleModeChange('light')} selected={mode === 'light'}>
              <ListItemIcon><Brightness7Icon fontSize="small" /></ListItemIcon>
              Light
            </MenuItem>
            <MenuItem onClick={() => handleModeChange('dark')} selected={mode === 'dark'}>
              <ListItemIcon><Brightness4Icon fontSize="small" /></ListItemIcon>
              Dark
            </MenuItem>
            <MenuItem onClick={() => handleModeChange('system')} selected={mode === 'system'}>
              <ListItemIcon><SettingsBrightnessIcon fontSize="small" /></ListItemIcon>
              System
            </MenuItem>
          </Menu>

          {/* User Menu */}
          {user ? (
            <>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleUserMenuClick}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={openUserMenu ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={openUserMenu ? 'true' : undefined}
                >
                  <Avatar sx={{ width: 32, height: 32 }} src={user.picture} alt={user.name}>
                    {user.name ? user.name.charAt(0) : '?'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={userMenuAnchorEl}
                id="account-menu"
                open={openUserMenu}
                onClose={handleUserMenuClose}
                onClick={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" color="textSecondary">
                    {user.name} ({user.role})
                  </Typography>
                </MenuItem>
                <Divider />
                {user.role === UserRole.ADMIN && (
                  <MenuItem onClick={handleSettings}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                )}
                {user.role === UserRole.ADMIN && (
                  <MenuItem onClick={handleLogs}>
                    <ListItemIcon>
                      <ArticleIcon fontSize="small" />
                    </ListItemIcon>
                    Logs
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button 
              color="inherit" 
              startIcon={<LoginIcon />} 
              onClick={login}
              sx={{ ml: 1 }}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile Drawer */}
        {!isDesktop && (
            <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
                keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            >
            {drawerContent}
            </Drawer>
        )}
        
        {/* Desktop Drawer */}
        {isDesktop && (
            <Drawer
            variant="permanent"
            sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
            >
            {drawerContent}
            </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
}