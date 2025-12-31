
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mcpglihtfmytkuqjscee.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcGdsaWh0Zm15dGt1cWpzY2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzIyNjgsImV4cCI6MjA4Mjc0ODI2OH0.AuuJV_04wKZ3IekFZc5Vz3UkyECuqiLLibwed48Z9ro';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
