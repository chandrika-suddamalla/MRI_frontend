import { AccountCircle } from '@mui/icons-material';
import { Avatar, Box, Container, Paper, Stack, Typography } from '@mui/material';
import Navbar from '../components/Navbar';

function Profile() {
  const email = localStorage.getItem('userEmail') || 'user@company.com';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar />
      <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 }, maxWidth: 'none' }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: 1, borderColor: 'divider', borderRadius: 3 }}>
          <Stack spacing={3} alignItems="flex-start">
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main' }}>
              <AccountCircle sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                User Profile
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Your account information is shown below.
              </Typography>
            </Box>
            <Paper variant="outlined" sx={{ p: 2, width: '100%', borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email address
              </Typography>
              <Typography variant="h6" sx={{ mt: 0.5 }}>
                {email}
              </Typography>
            </Paper>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

export default Profile;
