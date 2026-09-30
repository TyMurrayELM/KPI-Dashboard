import { createClient } from '@supabase/supabase-js';
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hegqhybvnoalzkxljrpf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3FoeWJ2bm9hbHpreGxqcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjU4MTcsImV4cCI6MjA3OTM0MTgxN30.75_4I4Hc3gfO51eABs0cYX6vaPGaeTEQaTm5O-GSuLY'
);
const { data: roles } = await s.from('roles').select('key,name,is_visible,base_salary,bonus_percentage,role_kpis(id)').order('display_order');
for (const r of roles||[]) if (/business|growth/i.test(r.key+r.name)) console.log(JSON.stringify(r));
const { data: ur, error } = await s.from('user_roles').select('user_email,role_key').ilike('user_email','%jelinek%');
console.log('user_roles', error, JSON.stringify(ur));
const { data: au, error: e2 } = await s.from('allowed_users').select('*').ilike('email','%jelinek%');
console.log('allowed_users', e2?.message, JSON.stringify(au));
