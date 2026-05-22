'use client'

import { useParams } from 'next/navigation'
import { ArabicPageContent } from '../page'

const SLUG_TO_ID = {
  slides:         'home',
  about:          'about',
  'virtual-tour': 'virtual-tour',
  gallery:        'gallery',
  archive:        'archive-section',
  exclusive:      'exclusive-section',
  showcase:       'showcase',
  contact:        'contact',
  reserve:        'reserve',
}

export default function ArabicCatchAll() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug
  const initialSection = SLUG_TO_ID[slug] || null
  return <ArabicPageContent initialSection={initialSection} />
}
