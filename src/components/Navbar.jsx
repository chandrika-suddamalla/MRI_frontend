import { AccountCircle, History as HistoryIcon, Logout, MenuBook, Insights } from '@mui/icons-material';
import { AppBar, Box, Button, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Navbar({ title = 'Market Research Intelligence Assistant' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const email = localStorage.getItem('userEmail') || 'user@company.com';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const navItems = useMemo(() => [
    { label: 'Dashboard', path: '/dashboard', icon: <MenuBook /> },
    { label: 'History', path: '/history', icon: <HistoryIcon /> },
    { label: 'Profile', path: '/profile', icon: <AccountCircle /> },
  ], []);

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper', width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.5, px: { xs: 2, md: 4 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Insights color="primary" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {email}
            </Typography>
            <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
              Profile
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, p: 2 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Navigation
          </Typography>
          <List>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => {
                    setDrawerOpen(false);
                    navigate(item.path);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
            <ListItemButton onClick={() => {
              setDrawerOpen(false);
              handleLogout();
            }}>
              <ListItemIcon><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;
