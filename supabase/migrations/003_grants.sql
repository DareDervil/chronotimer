-- ============================================================
-- Chronicon — Role grants
-- RLS policies only run after table-level permissions are set.
-- ============================================================

-- authenticated role: full access (RLS policies control row visibility)
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_phases to authenticated;
grant select, insert, update, delete on public.workout_blocks to authenticated;
grant select, insert, update, delete on public.block_exercises to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;

-- anon role: read-only on tables needed for public share page (/w/[slug])
-- RLS policies still restrict to is_public=true rows
grant select on public.workouts to anon;
grant select on public.workout_phases to anon;
grant select on public.workout_blocks to anon;
grant select on public.block_exercises to anon;
grant select on public.exercises to anon;
