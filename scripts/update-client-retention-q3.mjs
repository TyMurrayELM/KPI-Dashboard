// Upsert official Q3 Client Retention % actuals (CSS users + Quality Manager).
// Dry-run by default; pass --apply to write.
//   node scripts/update-client-retention-q3.mjs
//   node scripts/update-client-retention-q3.mjs --apply
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hegqhybvnoalzkxljrpf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3FoeWJ2bm9hbHpreGxqcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjU4MTcsImV4cCI6MjA3OTM0MTgxN30.75_4I4Hc3gfO51eABs0cYX6vaPGaeTEQaTm5O-GSuLY'
);

const KPI = 'Client Retention %';
const UPDATES = [
  { name: 'Emily Thompson', email: 'emily.thompson@encorelm.com', Q3: 85 },
  { name: 'Harley Rowell', email: 'harley.konya@encorelm.com', Q3: 90 },
  { name: 'Haley Bond', email: 'hcampbell@encorelm.com', Q3: 84 },
  { name: 'Alex Deep', email: 'alex.deep@encorelm.com', Q3: 87 },
  { name: 'Mark Deleon', email: 'mark.deleon@encorelm.com', Q3: 100 },
];
const apply = process.argv.includes('--apply');

const { data: existing, error: existingError } = await supabase
  .from('user_kpi_actuals')
  .select('user_email, period, actual, locked')
  .eq('kpi_name', KPI)
  .in('user_email', UPDATES.map(u => u.email));
if (existingError) throw existingError;

for (const upd of UPDATES) {
  const period = 'Q3';
  const cur = existing.find(e => e.user_email === upd.email && e.period === period);
  const curDesc = cur ? `${cur.actual} (locked=${cur.locked})` : '(none)';
  console.log(`${upd.name} <${upd.email}> ${period}: ${curDesc} -> ${upd[period]} (locked=true)`);
  if (apply) {
    const { error } = await supabase.from('user_kpi_actuals').upsert(
      {
        user_email: upd.email,
        kpi_name: KPI,
        period,
        actual: upd[period],
        locked: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email,kpi_name,period' }
    );
    if (error) throw error;
  }
}
console.log(apply ? 'Applied.' : 'Dry run only — re-run with --apply to write.');
