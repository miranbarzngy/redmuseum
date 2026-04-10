import { redirect } from 'next/navigation'

// Catch-all: /arabic/about, /arabic/gallery, etc.
// Redirect to the Arabic homepage — the sidebar URL-on-scroll handles the rest
export default function ArabicCatchAll() {
  redirect('/arabic')
}
