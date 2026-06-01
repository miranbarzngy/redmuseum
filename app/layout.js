import './globals.css'
import { getMuseumName } from './lib/getMuseumName'

export async function generateMetadata() {
  const name = await getMuseumName()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amna-suraka.com'
  return {
    title: { default: name.en, template: `%s | ${name.en}` },
    description: `${name.en} (Red Prison) - Not To Be Forgotten`,
    keywords: ['museum', 'Kurdistan', 'Amna Suraka', 'Sulaimani', 'genocide', 'history'],
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: 'website',
      siteName: name.en,
      title: name.en,
      description: `${name.en} (Red Prison) - Not To Be Forgotten`,
      images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary',
      title: name.en,
      description: `${name.en} (Red Prison) - Not To Be Forgotten`,
      images: ['/android-chrome-512x512.png'],
    },
    robots: { index: true, follow: true },
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
