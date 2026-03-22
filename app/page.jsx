import { redirect } from 'next/navigation'

// Force clean build - redirect to Kurdish version by default
export default function Home() {
  redirect('/kurdish')
}
