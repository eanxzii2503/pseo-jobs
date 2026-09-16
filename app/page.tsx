import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, type RemoteJob } from '@/lib/supabase';

export const revalidate = 3600; // re-check for new jobs at most once an hour

export const metadata: Metadata = {
  title: 'Remote Roles — Fresh remote jobs, updated daily',
  description: 'Browse remote jobs by category and location, pulled fresh from open job providers every day.'
};

const JOBS_PER_PAGE = 40;

type HomeProps = {
  searchParams: { category?: string };
};

async function getCategories(): Promise<string[]> {
  // remote_jobs stays well under the free-tier row cap, so pulling the category
  // column and de-duplicating in memory is cheaper than a second RPC round trip.
  const { data, error } = await supabase.from('remote_jobs').select('category');
  if (error || !data) return [];
  const unique = Array.from(new Set(data.map((row) => row.category))).sort();
  return unique;
}

async function getJobs(category?: string): Promise<RemoteJob[]> {
  let query = supabase
    .from('remote_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(JOBS_PER_PAGE);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as RemoteJob[];
}

function AdSlot({ label }: { label: string }) {
  // Fixed min-height keeps layout stable before the AdSense script loads,
  // which is what actually keeps Cumulative Layout Shift low — not the ad itself.
  return (
    <div
      className="my-8 flex min-h-[250px] w-full items-center justify-center border border-dashed border-line bg-white/50 text-xs text-ink/40"
      aria-label={label}
    >
      {/* Replace with your AdSense <ins> unit. Height is fixed on purpose — do not remove. */}
      Ad slot — {label}
    </div>
  );
}

export default async function HomePage({ searchParams }: HomeProps) {
  const activeCategory = searchParams.category;
  const [categories, jobs] = await Promise.all([getCategories(), getJobs(activeCategory)]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10 border-b border-line pb-8">
        <h1 className="font-display text-4xl font-bold leading-tight text-ink">
          Remote roles, refreshed every day
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/70">
          A directory of remote jobs collected from open job providers. Nothing
          curated by hand — just a fresh pull, filtered by what you actually do.
        </p>
      </header>

      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Filter by category">
        <Link
          href="/"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !activeCategory
              ? 'border-signalDark bg-signalDark text-white'
              : 'border-line text-ink/70 hover:border-signal hover:text-signal'
          }`}
        >
          All roles
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${encodeURIComponent(cat)}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? 'border-signalDark bg-signalDark text-white'
                : 'border-line text-ink/70 hover:border-signal hover:text-signal'
            }`}
          >
            {cat}
          </Link>
        ))}
      </nav>

      <AdSlot label="top-of-listings" />

      {jobs.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/60">
          No open roles in this category right now — check back after the next sync, or browse all roles.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {jobs.map((job, index) => (
            <li key={job.id}>
              <article className="py-6">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium text-signalDark">
                  <span className="rounded bg-signal/10 px-2 py-0.5">{job.category}</span>
                  <span className="text-ink/40">{job.location}</span>
                </div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  <Link href={`/remote-jobs/${job.slug}`} className="hover:text-signalDark">
                    {job.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-ink/70">
                  at {job.company}
                  {job.salary_range && job.salary_range !== 'Undisclosed' ? ` · ${job.salary_range}` : ''}
                </p>
              </article>
              {/* One reserved ad slot every 8 listings, never adjacent to another */}
              {(index + 1) % 8 === 0 && index !== jobs.length - 1 ? (
                <AdSlot label={`inline-${index + 1}`} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
