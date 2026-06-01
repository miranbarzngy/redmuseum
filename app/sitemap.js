export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://amna-suraka.com'

  const routes = [
    { url: `${base}/kurdish`,                   priority: 1.0 },
    { url: `${base}/kurdish/slides`,            priority: 0.8 },
    { url: `${base}/kurdish/about`,             priority: 0.8 },
    { url: `${base}/kurdish/gallery`,           priority: 0.8 },
    { url: `${base}/kurdish/archive`,           priority: 0.8 },
    { url: `${base}/kurdish/virtual-tour`,      priority: 0.7 },
    { url: `${base}/kurdish/museumactivities`,  priority: 0.7 },
    { url: `${base}/kurdish/contact`,           priority: 0.7 },
    { url: `${base}/kurdish/reserve`,           priority: 0.9 },
    { url: `${base}/arabic`,                    priority: 0.9 },
    { url: `${base}/arabic/about`,              priority: 0.7 },
    { url: `${base}/arabic/gallery`,            priority: 0.7 },
    { url: `${base}/arabic/reserve`,            priority: 0.8 },
  ]

  return routes.map(r => ({
    url: r.url,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: r.priority,
  }))
}
