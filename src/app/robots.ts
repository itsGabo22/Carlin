import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    // Assuming deployed on Vercel and we use NEXT_PUBLIC_SITE_URL or VERCEL_URL
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://carlin-web.vercel.app'}/sitemap.xml`,
  };
}
