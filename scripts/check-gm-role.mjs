import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hegqhybvnoalzkxljrpf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3FoeWJ2bm9hbHpreGxqcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjU4MTcsImV4cCI6MjA3OTM0MTgxN30.75_4I4Hc3gfO51eABs0cYX6vaPGaeTEQaTm5O-GSuLY'
);
const { data: roles, error } = await supabase.from('roles')
  .select('key,name,is_visible,display_order,base_salary,bonus_percentage, role_kpis(id)')
  .order('display_order');
console.log('roles error:', error);
for (const r of (roles || []))
  console.log(`${String(r.is_visible)}  ${r.key}  |  ${r.name}  | kpis: ${(r.role_kpis||[]).length} | salary: ${r.base_salary} | bonus%: ${r.bonus_percentage}`);
const { data: ur, error: e2 } = await supabase.from('user_roles').select('user_email,role_key').ilike('user_email','%swanson%');
console.log('user_roles error:', e2, 'rows:', JSON.stringify(ur));
