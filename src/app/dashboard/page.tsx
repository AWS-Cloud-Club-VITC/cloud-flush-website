"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Redirects to /dashboard/leader or /dashboard/member based on role
export default function DashboardRouter() {
  const router = useRouter();
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/"); return; }
      const { data } = await supabase.from("teams").select("id").eq("leader_id", user.id).single();
      router.replace(data ? "/dashboard/leader" : "/dashboard/member");
    });
  }, [router]);
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#080808" }}>
      <div className="text-white/40 text-sm animate-pulse">Loading…</div>
    </div>
  );
}
