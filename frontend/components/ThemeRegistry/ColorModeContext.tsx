'use client';
import * as React from 'react';

export type ColorMode = 'light' | 'dark' | 'system';

interface ColorModeContextType {
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
}

export const ColorModeContext = React.createContext<ColorModeContextType>({
  mode: 'system',
  setMode: () => {},
});

export const useColorMode = () => React.useContext(ColorModeContext);
