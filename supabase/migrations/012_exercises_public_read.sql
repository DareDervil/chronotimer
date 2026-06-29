-- ============================================================
-- Fix: exercises readable on public share pages
--
-- Previous policy required auth.uid() is not null, which
-- blocked unauthenticated visitors from seeing exercise names
-- on /w/[slug] share pages.
--
-- New policy:
--   - Library exercises (is_custom=false): readable by anyone
--   - Custom exercises: readable by creator, OR by anyone when
--     the exercise is used in a public workout (share page)
-- ============================================================

drop policy "Library exercises visible to all authenticated users" on exercises;

create policy "Exercises readable by all with custom privacy"
  on exercises for select using (
    -- Library exercises are public data
    not is_custom
    -- Custom: own exercises always readable
    or created_by = auth.uid()
    -- Custom: readable if referenced by a public workout (share page)
    or exists (
      select 1
      from block_exercises be
      join workout_blocks  wb on wb.id = be.block_id
      join workout_phases  wp on wp.id = wb.phase_id
      join workouts         w on w.id  = wp.workout_id
      where be.exercise_id = exercises.id
        and w.is_public = true
    )
  );
