-- Update: 2026-03-15
-- Purpose: Keep all constraint rounds disabled by default until admin explicitly enables them.

alter table public.constraint_round_settings
  alter column is_enabled set default false;

update public.constraint_round_settings
set
  is_enabled = false,
  updated_at = timezone('utc', now())
where true;