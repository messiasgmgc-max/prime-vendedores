import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://juqjxehutxwxkytkpjae.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0mJZy4WlNquiNhWp5q_rFA_xv5FXm1T";

// Cliente público para o frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com service role para rotas de backend (se necessário)
export const getServiceSupabase = () => {
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey);
};
