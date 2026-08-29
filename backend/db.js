import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing. The app will run without database connectivity.');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function getFailedPayments(limit = 100) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('failed_payments')
    .select('*')
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
