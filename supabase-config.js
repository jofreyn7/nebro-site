// ============================================================
// Supabase client config.
// Fill these in from: Supabase Dashboard → Project Settings → API
// SUPABASE_ANON_KEY is safe to expose in frontend code — it only
// works within the RLS policies defined in supabase/migrations/0001_init.sql.
// NEVER put your service_role key in any frontend file.
// ============================================================
const SUPABASE_URL = 'https://rklivvjennwiiaksbjmy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QIA5O02MWdwAlLrgCaKXjA_S4W96qt7';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
