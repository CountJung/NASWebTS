'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Prevent multiple calls if token is already set or being processed
      // But here we want to update the token.
      // The issue is that checkAuth updates context, which triggers re-render, which triggers useEffect again.
      // We should only run this effect when the token changes in the URL.
      
      localStorage.setItem('accessToken', token);
      
      checkAuth().then(() => {
        router.push('/');
      });
    } else {
      router.push('/login?error=missing_token');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only run when searchParams change

  return <div>Processing login...</div>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
