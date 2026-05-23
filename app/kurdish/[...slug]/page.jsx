'use client'

import { useParams } from 'next/navigation'
import { KurdishPageContent } from '../page'

// Maps URL slug → HTML element ID used in the page
const SLUG_TO_ID = {
  slides:         'home',
  about:          'about',
  'virtual-tour': 'virtual-tour',
  gallery:        'gallery',
  archive:        'archive-section',
  museumactivities: 'exclusive-section',
  exclusive:        'exclusive-section',
  showcase:       'showcase',
  contact:        'contact',
  reserve:        'reserve',
}

export default function KurdishCatchAll() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const initialSection = SLUG_TO_ID[slug] || null
  return <KurdishPageContent initialSection={initialSection} />
}
