// scripts/sync-jobs.js
// Pulls fresh listings from Remotive's public jobs API and upserts them into Supabase.
// Run manually with `npm run sync-jobs`, or on a schedule via GitHub Actions.
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Remotive's actual public API endpoint (the homepage URL is not an API and returns HTML, not JSON).
const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

// How many rows to send per upsert call. Supabase/PostgREST can choke on very
// large single payloads, so we batch instead of sending everything at once.
const BATCH_SIZE = 500;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateSlug(job) {
  // job_provider_id is appended so two jobs with an identical title/company/location
  // (which happens more than you'd expect) never collide on the unique slug column.
  const base = slugify(`${job.title}-${job.company_name}-${job.candidate_required_location || 'global'}`);
  return `${base}-${job.id}`;
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

async function fetchAndSyncJobs() {
  console.log(`Fetching jobs from ${REMOTIVE_API_URL} ...`);

  const response = await fetch(REMOTIVE_API_URL);
  if (!response.ok) {
    throw new Error(`Remotive API responded with ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];

  if (jobs.length === 0) {
    console.log('No jobs returned by the provider. Nothing to sync.');
    return;
  }

  console.log(`Fetched ${jobs.length} raw job listings.`);

  const formattedJobs = jobs
    .filter((job) => job && job.id && job.title && job.company_name && job.url)
    .map((job) => ({
      job_provider_id: String(job.id),
      title: job.title.trim(),
      company: job.company_name.trim(),
      category: job.category || 'General Remote',
      location: job.candidate_required_location || 'Global',
      salary_range: job.salary && job.salary.trim() ? job.salary.trim() : 'Undisclosed',
      apply_url: job.url,
      description: stripHtml(job.description),
      slug: generateSlug(job)
    }));

  const skipped = jobs.length - formattedJobs.length;
  if (skipped > 0) {
    console.warn(`Skipped ${skipped} listing(s) missing required fields (id/title/company/url).`);
  }

  const batches = chunk(formattedJobs, BATCH_SIZE);
  console.log(`Upserting ${formattedJobs.length} jobs in ${batches.length} batch(es) of up to ${BATCH_SIZE}...`);

  let upserted = 0;
  for (const [index, batch] of batches.entries()) {
    const { error } = await supabase
      .from('remote_jobs')
      .upsert(batch, { onConflict: 'job_provider_id' });

    if (error) {
      throw new Error(`Batch ${index + 1}/${batches.length} failed: ${error.message}`);
    }
    upserted += batch.length;
    console.log(`  batch ${index + 1}/${batches.length} OK (${upserted}/${formattedJobs.length} total)`);
  }

  console.log('Sync completed successfully.');
}

fetchAndSyncJobs().catch((error) => {
  console.error('Ingestion workflow failed:', error.message);
  process.exit(1);
});
