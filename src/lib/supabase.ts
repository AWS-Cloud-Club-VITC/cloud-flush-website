import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// A separate client that never persists a session — safe to call signUp
// from the leader's browser without overwriting the leader's session.
export function createEphemeralClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Team = {
  id: string;
  team_name: string;
  leader_id: string;
  is_vit_chennai: boolean;
  points: number;
  created_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  name: string;
  reg_no: string;
  email: string;
  user_id: string | null;
  created_at: string;
};
