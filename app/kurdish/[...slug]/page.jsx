import { redirect } from 'next/navigation'

// Catch-all: /kurdish/about, /kurdish/gallery, etc.
// Redirect to the Kurdish homepage — the sidebar URL-on-scroll handles the rest
export default function KurdishCatchAll() {
  redirect('/kurdish')
}
