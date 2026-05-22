'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from './supabase-client'

export const MUSEUM_NAME_DEFAULTS = {
  en: 'Amna Suraka National Museum',
  kr: 'مۆزەخانەی نیشتمانی ئەمنە سورەکە',
  ar: 'متحف أمن احمر الوطای',
}

export function useMuseumName() {
  const [names, setNames] = useState(MUSEUM_NAME_DEFAULTS)

  useEffect(() => {
    const sb = getSupabaseClient()
    if (!sb) return
    sb.from('settings')
      .select('museum_name_en,museum_name_kr,museum_name_ar')
      .single()
      .then(({ data }) => {
        if (!data) return
        setNames({
          en: data.museum_name_en || MUSEUM_NAME_DEFAULTS.en,
          kr: data.museum_name_kr || MUSEUM_NAME_DEFAULTS.kr,
          ar: data.museum_name_ar || MUSEUM_NAME_DEFAULTS.ar,
        })
      })
  }, [])

  return names
}
