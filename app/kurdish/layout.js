import '../globals.css'

export const metadata = {
  title: 'مۆزەخانەی نیشتمانی ئەمنە سورەکە',
  description: 'مۆزەخانەی ئەمنە سورەکە (زیندانی سوور) - بۆ ئەوەی لەبیرنەکرێت',
  keywords: ['مۆزەخانە', 'کوردستان', 'ئەمنە سورەکە', 'سلێمانی', 'کۆینە', 'مێژوو'],
}

export default function KurdishLayout({ children }) {
  return (
    <div className="kurdish-layout">
      {children}
    </div>
  )
}
