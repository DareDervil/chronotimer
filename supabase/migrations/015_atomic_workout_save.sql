-- ============================================================
-- Chronicon — Atomic workout create/update
--
-- Problem: lib/actions/workouts.ts previously built a workout's
-- phases/blocks/exercises with a sequence of separate insert()
-- calls (insertStructure). Each call is its own network request /
-- implicit transaction, so a failure partway through left the DB
-- with partial state:
--   - createWorkout: an orphaned workout row with incomplete structure
--   - updateWorkout: old phases already deleted, new ones only partially
--     inserted — actual data loss
--
-- Fix: do the whole create-or-update in a single plpgsql function.
-- A top-level function call runs as one transaction — if any
-- statement inside raises, everything the function did is rolled
-- back automatically. Mirrors the existing delete_user_account()
-- pattern (014_delete_user_function.sql) for the same reason.
-- ============================================================

create or replace function save_workout(
  p_workout_id uuid,   -- null => create a new workout
  p_name text,
  p_description text,
  p_phases jsonb        -- [{ phase_type, blocks: [{ block_type, config, exercises: [{ exercise_id, duration_s, reps, sets, rest_after_s }] }] }]
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_workout_id uuid;
  phase_rec record;
  block_rec record;
  exercise_rec record;
  v_phase_id uuid;
  v_block_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_workout_id is null then
    insert into workouts (user_id, name, description)
    values (auth.uid(), p_name, p_description)
    returning id into v_workout_id;
  else
    update workouts
    set name = p_name, description = p_description
    where id = p_workout_id and user_id = auth.uid()
    returning id into v_workout_id;

    if v_workout_id is null then
      raise exception 'Workout not found or access denied';
    end if;
  end if;

  -- Replace existing structure (no-op for a brand new workout)
  delete from workout_phases where workout_id = v_workout_id;

  for phase_rec in
    select value as phase, (ordinality - 1)::int as idx
    from jsonb_array_elements(coalesce(p_phases, '[]'::jsonb)) with ordinality as t(value, ordinality)
  loop
    -- Skip phases with no blocks, same as the old client-side logic
    if jsonb_array_length(coalesce(phase_rec.phase->'blocks', '[]'::jsonb)) = 0 then
      continue;
    end if;

    insert into workout_phases (workout_id, phase_type, order_index)
    values (v_workout_id, (phase_rec.phase->>'phase_type')::phase_type, phase_rec.idx)
    returning id into v_phase_id;

    for block_rec in
      select value as block, (ordinality - 1)::int as idx
      from jsonb_array_elements(phase_rec.phase->'blocks') with ordinality as t(value, ordinality)
    loop
      insert into workout_blocks (phase_id, block_type, config, order_index)
      values (
        v_phase_id,
        (block_rec.block->>'block_type')::block_type,
        coalesce(block_rec.block->'config', '{}'::jsonb),
        block_rec.idx
      )
      returning id into v_block_id;

      for exercise_rec in
        select value as exercise, (ordinality - 1)::int as idx
        from jsonb_array_elements(coalesce(block_rec.block->'exercises', '[]'::jsonb)) with ordinality as t(value, ordinality)
      loop
        insert into block_exercises (block_id, exercise_id, duration_s, reps, sets, rest_after_s, order_index)
        values (
          v_block_id,
          (exercise_rec.exercise->>'exercise_id')::uuid,
          nullif(exercise_rec.exercise->>'duration_s', '')::int,
          nullif(exercise_rec.exercise->>'reps', '')::int,
          nullif(exercise_rec.exercise->>'sets', '')::int,
          coalesce(nullif(exercise_rec.exercise->>'rest_after_s', '')::int, 0),
          exercise_rec.idx
        );
      end loop;
    end loop;
  end loop;

  return v_workout_id;
end;
$$;

revoke all on function save_workout(uuid, text, text, jsonb) from public;
grant execute on function save_workout(uuid, text, text, jsonb) to authenticated;
