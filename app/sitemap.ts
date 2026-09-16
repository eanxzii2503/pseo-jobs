import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export const revalidate = 43200; // twice a day is enough for a sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myjobboard.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    }
  ];

  const { data: jobs, error } = await supabase
    .from('remote_jobs')
    .select('slug, updated_at')
    .order('created_at', { ascending: false })
    .limit(45000); // Google's per-sitemap URL cap; split into a sitemap index if you exceed this

  if (error || !jobs) {
    console.error('Failed to fetch slugs for sitemap generation:', error?.message);
    return staticRoutes;
  }

  const dynamicRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${BASE_URL}/remote-jobs/${job.slug}`,
    lastModified: new Date(job.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7
  }));

  return [...staticRoutes, ...dynamicRoutes];
}
