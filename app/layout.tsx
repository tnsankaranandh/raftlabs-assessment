import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Food Order Management',
  description: 'Simple order management for a food delivery app',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

export const fetchCache = 'force-no-store';
export const dynamic = 'force-dynamic';

