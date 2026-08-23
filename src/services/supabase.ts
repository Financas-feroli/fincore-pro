import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aecnjriahawgrmzjepiq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlY25qcmlhaGF3Z3JtemplcGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MzU3NTksImV4cCI6MjEwMzAxMTc1OX0.eiBf73lTzYa3lAlVDesBE1zi5_A24qYyPDwpkX5r7Mc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
