'use client';

import { Button, Box, Typography } from '@mui/material';

export default function LoginPage() {
  const handleLogin = () => {
    // TODO: Use environment variable for backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Typography variant="h4" gutterBottom>NAS Web Login</Typography>
      <Button variant="contained" onClick={handleLogin}>
        Login with Google
      </Button>
    </Box>
  );
}
