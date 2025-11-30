'use client';
import { ThemeOptions } from '@mui/material/styles';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const getThemeOptions = (mode: 'light' | 'dark'): ThemeOptions => ({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  palette: {
    mode,
    ...(mode === 'dark' && {
      background: {
        default: '#121212',
        paper: '#1e1e1e',
      },
    }),
  },
});
