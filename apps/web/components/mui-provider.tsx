'use client'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import type { ReactNode } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#14B8A6',
      dark: '#0D9488',
      light: '#2DD4BF',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E57373',
      dark: '#EF5350',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8FAFB',
      paper: '#ffffff',
    },
    text: {
      primary: '#0F2137',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: null },
    },
  },
})

export function MuiProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
