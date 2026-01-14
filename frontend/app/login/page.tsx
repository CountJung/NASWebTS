'use client';

import { Button, Box, Typography, Alert } from '@mui/material';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleLogin = () => {
    // TODO: Use environment variable for backend URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh">
      <Typography variant="h4" gutterBottom>NAS Web Login</Typography>

      {error === 'banned' && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 520 }}>
          이 계정은 접근이 차단되었습니다. 관리자에게 문의하세요.
        </Alert>
      )}

      <Button variant="contained" onClick={handleLogin}>
        Login with Google
      </Button>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
