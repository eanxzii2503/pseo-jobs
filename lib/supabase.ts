import { createClient } from '@supabase/supabase-js';

// Frontend reads always use the public anon key. Row Level Security (see
// supabase/schema.sql) restricts this key to SELECT only — all writes happen
// server-side in scripts/sync-jobs.js with the service_role key instead.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false }
  }
);

export type RemoteJob = {
  id: string;
  job_provider_id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  salary_range: string | null;
  apply_url: string;
  description: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
};
