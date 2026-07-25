import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  /* const getErrorMessage = (err, fallbackMessage) => {
    const data = err?.response?.data;

    if (typeof data === 'string') {
      return data;
    }

    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    if (data?.detail && typeof data.detail === 'object') {
      if (typeof data.detail.msg === 'string') {
        return data.detail.msg;
      }

      if (typeof data.detail.message === 'string') {
        return data.detail.message;
      }
    }

    if (typeof data?.message === 'string') {
      return data.message;
    }

    if (typeof data?.error === 'string') {
      return data.error;
    }

    if (Array.isArray(data?.detail)) {
      const messages = data.detail
        .map((item) => (typeof item === 'string' ? item : item?.msg || item?.message))
        .filter(Boolean);

      if (messages.length) {
        return messages.join(' ');
      }
    }

    if (typeof err?.message === 'string' && err.message !== 'Network Error') {
      return err.message;
    }

    return fallbackMessage;
  }; */

  const persistAuth = (accessToken, user) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userEmail', user?.email || email);
    localStorage.setItem('userRole', user?.role || 'Analyst');
    navigate('/dashboard');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering ? { email, password, confirm_password: confirmPassword } : { email, password };
      const response = await api.post(endpoint, payload);
      const { access_token, user } = response.data;
      persistAuth(access_token, user);
    } catch (err) {
      const data = err?.response?.data;
      const backendMessage = typeof data === 'string'
        ? data
        : (typeof data?.detail === 'string'
            ? data.detail
            : (typeof data?.message === 'string'
                ? data.message
                : (typeof data?.error === 'string'
                    ? data.error
                    : 'Unable to complete the request right now. Please try again.')));
      setError(backendMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440, p: 1 }}>
        <CardContent>
          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{isRegistering ? 'Create account' : 'Sign in'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {isRegistering ? 'Create a new Market Research Intelligence Assistant account' : 'Access the Market Research Intelligence Assistant'}
              </Typography>
            </Box>
            <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="Password" type="password" fullWidth required value={password} onChange={(e) => setPassword(e.target.value)} />
            {isRegistering && (
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : isRegistering ? 'Create account' : 'Login'}
            </Button>
            <Button variant="text" onClick={() => setIsRegistering((value) => !value)}>
              {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Login;
