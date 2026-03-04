import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: 'ZICOTV - Sports Live Streaming',
  description: 'Premium sports streaming platform for Smart TV',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 1920,
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}
