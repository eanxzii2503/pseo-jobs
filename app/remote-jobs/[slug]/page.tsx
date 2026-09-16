import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sanitizeHtml from 'sanitize-html';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400; // one static rebuild per day is plenty for a job posting

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: job } = await supabase
    .from('remote_jobs')
    .select('title, company, location')
    .eq('slug', params.slug)
    .single();

  if (!job) return { title: 'Job not found' };

  return {
    title: `Remote ${job.title} at ${job.company} (${job.location})`,
    description: `Apply for the remote ${job.title} role at ${job.company}, open to candidates in ${job.location}. See the full description and apply directly.`,
    robots: 'index, follow'
  };
}

export default async function JobPage({ params }: Props) {
  const { data: job, error } = await supabase
    .from('remote_jobs')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !job) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <a href="/" className="text-xs font-medium text-signalDark hover:underline">
        ← All roles
      </a>

      <article className="mt-6">
        <header className="border-b border-line pb-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-signalDark">
            <span className="rounded bg-signal/10 px-2 py-0.5">{job.category}</span>
            <span className="text-ink/40">{job.location}</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">{job.title}</h1>
          <p className="mt-2 text-base text-ink/70">at {job.company}</p>
          {job.salary_range && job.salary_range !== 'Undisclosed' ? (
            <p className="mt-1 text-sm font-medium text-signalDark">{job.salary_range}</p>
          ) : null}
        </header>

        {/* Reserved, fixed-height affiliate slot — set your real link before deploying */}
        <div className="my-6 border border-dashed border-line bg-white/50 p-4 text-sm text-ink/70">
          Setting up a remote workspace? See ergonomic desk and chair picks —{' '}
          <a
            href="#"
            rel="nofollow sponsored noopener noreferrer"
            className="font-medium text-signalDark underline"
          >
            replace this with your affiliate link
          </a>
          .
        </div>

        <section className="prose prose-sm max-w-none py-6 text-ink/90">
          <h2 className="font-display text-lg font-semibold text-ink">Job description</h2>
          {/* job.description comes from an external provider (raw HTML). Sanitized
              server-side with sanitize-html before rendering, so it's safe to use
              dangerouslySetInnerHTML here — never render provider HTML unsanitized. */}
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(job.description ?? '', {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3']),
                allowedAttributes: { a: ['href', 'rel', 'target'] }
              })
            }}
          />
        </section>

        <footer className="border-t border-line pt-6">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-block rounded bg-signalDark px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-signal"
          >
            Apply for this position
          </a>
        </footer>
      </article>
    </main>
  );
}
