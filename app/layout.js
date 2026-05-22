import './globals.css'
import { getMuseumName } from './lib/getMuseumName'

export async function generateMetadata() {
  const name = await getMuseumName()
  return {
    title: name.en,
    description: `${name.en} (Red Prison) - Not To Be Forgotten`,
    keywords: ['museum', 'Kurdistan', 'Amna Suraka', 'Sulaimani', 'genocide', 'history'],
  }
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
