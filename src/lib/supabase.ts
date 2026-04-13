import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bjgmostqijxqsyntjrpi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZ21vc3RxaWp4cXN5bnRqcnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDYyOTIsImV4cCI6MjA5MTEyMjI5Mn0.uZW1noKcQBjxY3mMJQqfWxbt514QnUhzu3uFKtHIF6A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
