import './globals.css'
import { Metadata } from 'next'

export const metadata = {
  title: 'Amnasuraka National Museum',
  description: 'Amna Suraka (Red Prison) National Museum - Not To Be Forgotten',
  keywords: ['museum', 'Kurdistan', 'Amna Suraka', 'Sulaimani', 'genocide', 'history'],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.2.0/remixicon.css" 
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
