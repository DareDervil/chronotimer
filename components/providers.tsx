'use client'

import { ThemeProvider } from 'next-themes'

// next-themes renders an inline <script> to set the theme class before paint
// (avoids a flash of the wrong theme). React 19 warns about any <script> JSX
// during client-side reveals (e.g. an error boundary resolving), but the
// script already ran as part of the initial server-rendered HTML — this is a
// known false positive (react/react#34008, pacocoursey/next-themes#387), not
// a real bug, and doesn't fire in production builds.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return
    originalConsoleError(...args)
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
