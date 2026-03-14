import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin portal client uses isolated auth storage so admin login does not
// overwrite member/leader/coordinator browser session.
export const adminSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "cf-admin-auth" },
});

// Coordinator portal client uses isolated storage to avoid role session clashes.
export const coordinatorSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "cf-coordinator-auth" },
});

// Judge portal client uses isolated storage to avoid role session clashes.
export const judgeSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: "cf-judge-auth" },
});

// A separate client that never persists a session — safe to call signUp
// from the leader's browser without overwriting the leader's session.
export function createEphemeralClient() {
  const uniqueKey = `cf-ephemeral-${Math.random().toString(36).slice(2)}`;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: uniqueKey,
    },
  });
}

export type Team = {
  id: string;
  team_name: string;
  leader_id: string;
  is_vit_chennai: boolean;
  points: number;
  selected_problem_id: string | null;
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
