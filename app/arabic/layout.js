import '../globals.css'
import { getMuseumName } from '../lib/getMuseumName'

export async function generateMetadata() {
  const name = await getMuseumName()
  return {
    title: name.ar,
    description: `${name.ar} (السجن الأحمر) - لعدم النسيان`,
    keywords: ['متحف', 'كوردستان', 'أمضى سورەكە', 'السليمانية', 'كوة', 'تاريخ'],
  }
}

export default function ArabicLayout({ children }) {
  return (
    <div className="arabic-layout" dir="rtl">
      {children}
    </div>
  )
}
