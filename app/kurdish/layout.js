import '../globals.css'
import { getMuseumName } from '../lib/getMuseumName'

export async function generateMetadata() {
  const name = await getMuseumName()
  return {
    title: name.kr,
    description: `${name.kr} (زیندانی سوور) - بۆ ئەوەی لەبیرنەکرێت`,
    keywords: ['مۆزەخانە', 'کوردستان', 'ئەمنە سورەکە', 'سلێمانی', 'کۆینە', 'مێژوو'],
  }
}

export default function KurdishLayout({ children }) {
  return (
    <div className="kurdish-layout">
      {children}
    </div>
  )
}
