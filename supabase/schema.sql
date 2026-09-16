-- Run this in the Supabase SQL editor once, before the first sync.

create table if not exists public.remote_jobs (
  id uuid default gen_random_uuid() primary key,
  job_provider_id varchar(255) unique not null,
  title varchar(255) not null,
  company varchar(255) not null,
  category varchar(100) not null,
  location varchar(100) not null,
  salary_range varchar(100),
  apply_url text not null,
  description text,
  slug varchar(255) not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_jobs_slug on public.remote_jobs (slug);
create index if not exists idx_jobs_category_location on public.remote_jobs (category, location);

-- Keep updated_at accurate on every upsert (the sitemap relies on this for lastModified)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_remote_jobs_updated_at on public.remote_jobs;
create trigger trg_remote_jobs_updated_at
  before update on public.remote_jobs
  for each row
  execute function public.set_updated_at();

-- Row Level Security: the frontend uses the public anon key, so it must only
-- ever be able to read. All writes go through sync-jobs.js with the service_role key,
-- which bypasses RLS entirely.
alter table public.remote_jobs enable row level security;

drop policy if exists "Public read access" on public.remote_jobs;
create policy "Public read access"
  on public.remote_jobs
  for select
  to anon
  using (true);
