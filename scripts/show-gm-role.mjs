// Flip General Manager role visible. Reversible via the admin toggle.
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hegqhybvnoalzkxljrpf.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZ3FoeWJ2bm9hbHpreGxqcnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjU4MTcsImV4cCI6MjA3OTM0MTgxN30.75_4I4Hc3gfO51eABs0cYX6vaPGaeTEQaTm5O-GSuLY'
);
const { data, error } = await supabase.from('roles')
  .update({ is_visible: true }).eq('key', 'general-manager').select('key,is_visible');
console.log('error:', error, 'updated:', JSON.stringify(data));
