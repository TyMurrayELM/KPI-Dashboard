// Upsert Q1/Q2/Annual Client Retention % actuals for Alex Deep (LV CSS).
// Dry-run by default; pass --apply to write.
//   node scripts/update-client-retention-alex-deep.mjs
//   node scripts/update-client-retention-alex-deep.mjs --apply
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hegqhybvnoalzkxljrpf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3FoeWJ2bm9hbHpreGxqcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjU4MTcsImV4cCI6MjA3OTM0MTgxN30.75_4I4Hc3gfO51eABs0cYX6vaPGaeTEQaTm5O-GSuLY'
);

const KPI = 'Client Retention %';
const EMAIL = 'alex.deep@encorelm.com'; // <-- Alex Deep's login email, must match allowed_users exactly
// Q3/Q4 seeded at 90 (retention is cumulative — can't exceed the YTD floor);
// those two were applied with locked=false since they're running values.
const VALUES = { Q1: 96, Q2: 90, Q3: 90, Q4: 90, Annual: 90 };
const apply = process.argv.includes('--apply');

if (EMAIL.startsWith('SET-ME')) {
  console.error('Set EMAIL to Alex Deep\'s real login email first.');
  process.exit(1);
}

const { data: existing, error: e1 } = await supabase
  .from('user_kpi_actuals')
  .select('period, actual, locked')
  .eq('kpi_name', KPI)
  .eq('user_email', EMAIL);
if (e1) throw e1;

for (const [period, actual] of Object.entries(VALUES)) {
  const cur = existing.find(r => r.period === period);
  console.log(`Alex Deep <${EMAIL}> ${period}: ${cur ? `${cur.actual} (locked=${cur.locked})` : '(none)'} -> ${actual} (locked=true)`);
  if (apply) {
    const { error } = await supabase.from('user_kpi_actuals').upsert(
      { user_email: EMAIL, kpi_name: KPI, period, actual, locked: true, updated_at: new Date().toISOString() },
      { onConflict: 'user_email,kpi_name,period' }
    );
    if (error) throw error;
  }
}
console.log(apply ? 'Applied.' : 'Dry run only — re-run with --apply to write.');
