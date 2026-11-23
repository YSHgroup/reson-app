import type { ReactNode } from 'react'
import '../styles/globals.scss'
import '../styles/globals.css'
import '../styles/search.css'
import '../styles/create.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
