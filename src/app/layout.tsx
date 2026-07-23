import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
  adjustFontFallback: false,
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: {
    default: 'Mygreat | Study Abroad',
    template: '%s | Mygreat',
  },
  description: 'Discover universities, build your shortlist, and manage every step of your study abroad journey.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
