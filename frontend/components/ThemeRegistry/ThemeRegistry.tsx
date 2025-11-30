'use client';
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import NextAppDirEmotionCacheProvider from './EmotionCache';
import { getThemeOptions } from './theme';
import { ColorModeContext, ColorMode } from './ColorModeContext';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ColorMode>('system');
  const [mounted, setMounted] = React.useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  React.useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('themeMode') as ColorMode;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const colorMode = React.useMemo(
    () => ({
      mode,
      setMode: (newMode: ColorMode) => {
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
      },
    }),
    [mode],
  );

  const activeMode = React.useMemo(() => {
    if (!mounted) return 'light'; // Default to light during SSR to match server
    if (mode === 'system') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return mode;
  }, [mode, prefersDarkMode, mounted]);

  const theme = React.useMemo(
    () => createTheme(getThemeOptions(activeMode)),
    [activeMode],
  );

  // Prevent hydration mismatch by rendering children only after mount if system/dark is involved
  // Or better, just let it flicker but ensure correct final state.
  // Actually, returning null until mounted is bad for SEO and UX (blank screen).
  // We will render with 'light' initially (via activeMode default) and then switch.
  // This avoids the "mixed" look if the mixed look was due to partial hydration.

  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </NextAppDirEmotionCacheProvider>
  );
}