import { createClient } from '@supabase/supabase-js'

const DEFAULTS = {
  en: 'Amna Suraka National Museum',
  kr: 'مۆزەخانەی نیشتمانی ئەمنە سورەکە',
  ar: 'متحف أمن احمر الوطای',
}

export async function getMuseumName() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return DEFAULTS
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const { data } = await supabase
      .from('settings')
      .select('museum_name_en,museum_name_kr,museum_name_ar')
      .single()
    if (!data) return DEFAULTS
    return {
      en: data.museum_name_en || DEFAULTS.en,
      kr: data.museum_name_kr || DEFAULTS.kr,
      ar: data.museum_name_ar || DEFAULTS.ar,
    }
  } catch {
    return DEFAULTS
  }
}
