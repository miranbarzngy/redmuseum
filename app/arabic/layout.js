import '../globals.css'

export const metadata = {
  title: 'المتحف الوطني أمضى سورەكە',
  description: 'متحف أمضى سورەكە (السجن الأحمر) - لعدم النسيان',
  keywords: ['متحف', 'كوردستان', 'أمضى سورەكە', 'السليمانية', 'كوة', 'تاريخ'],
}

export default function ArabicLayout({ children }) {
  return (
    <div className="arabic-layout" dir="rtl">
      {children}
    </div>
  )
}
