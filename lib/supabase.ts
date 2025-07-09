import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://gpnkysawiietekujccir.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwbmt5c2F3aWlldGVrdWpjY2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjU1MzAsImV4cCI6MjA2NzY0MTUzMH0.OvWvWOSm-_49gqDAkd0ceIJx83HVc84X7Hwti-lauK4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
