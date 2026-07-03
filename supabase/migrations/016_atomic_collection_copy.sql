-- ============================================================
-- Chronicon — Atomic collection workout copy
--
-- Problem: lib/actions/collections.ts's addWorkoutToCollection and
-- cloneCollection deep-copy a workout's phases/blocks/exercises using
-- a sequence of separate insert() calls, exactly like the pre-fix
-- createWorkout/updateWorkout in 015_atomic_workout_save.sql. Each
-- call is its own request/implicit transaction, so a failure partway
-- through leaves an orphaned partial workout copy (and, for
-- cloneCollection, a partially-populated new collection).
--
-- Fix: push the deep-copy into plpgsql functions so each top-level
-- call is one atomic transaction. copy_workout_structure() is a
-- shared helper (mirrors the read-then-copy logic in both TS
-- functions); add_workout_to_collection() and clone_collection()
-- call it and wrap the rest of their own logic in the same
-- transaction. security invoker is used throughout so RLS still
-- governs which workouts/collections are visible to the caller,
-- exactly as it did with the direct table calls.
-- ============================================================

create or replace function copy_workout_structure(p_source_workout_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_source record;
  v_new_workout_id uuid;
  phase_rec record;
  block_rec record;
  v_new_phase_id uuid;
  v_new_block_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- RLS (via security invoker) filters this to only workouts the
  -- caller owns or that are public. No row => caller can't see it.
  select id, name, description into v_source
  from workouts
  where id = p_source_workout_id;

  if v_source.id is null then
    return null;
  end if;

  insert into workouts (user_id, name, description, is_public, share_slug)
  values (auth.uid(), v_source.name, v_source.description, false, null)
  returning id into v_new_workout_id;

  for phase_rec in
    select id, phase_type, order_index
    from workout_phases
    where workout_id = p_source_workout_id
    order by order_index
  loop
    insert into workout_phases (workout_id, phase_type, order_index)
    values (v_new_workout_id, phase_rec.phase_type, phase_rec.order_index)
    returning id into v_new_phase_id;

    for block_rec in
      select id, block_type, config, order_index
      from workout_blocks
      where phase_id = phase_rec.id
      order by order_index
    loop
      insert into workout_blocks (phase_id, block_type, config, order_index)
      values (v_new_phase_id, block_rec.block_type, block_rec.config, block_rec.order_index)
      returning id into v_new_block_id;

      insert into block_exercises (block_id, exercise_id, duration_s, reps, sets, rest_after_s, order_index)
      select v_new_block_id, exercise_id, duration_s, reps, sets, rest_after_s, order_index
      from block_exercises
      where block_id = block_rec.id
      order by order_index;
    end loop;
  end loop;

  return v_new_workout_id;
end;
$$;

revoke all on function copy_workout_structure(uuid) from public;
grant execute on function copy_workout_structure(uuid) to authenticated;

create or replace function add_workout_to_collection(
  p_collection_id uuid,
  p_workout_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_collection_id uuid;
  v_new_workout_id uuid;
  v_next_index int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id into v_collection_id
  from collections
  where id = p_collection_id and user_id = auth.uid();

  if v_collection_id is null then
    raise exception 'Collection not found';
  end if;

  v_new_workout_id := copy_workout_structure(p_workout_id);
  if v_new_workout_id is null then
    raise exception 'Workout not found';
  end if;

  select coalesce(max(order_index) + 1, 0) into v_next_index
  from collection_workouts
  where collection_id = v_collection_id;

  insert into collection_workouts (collection_id, workout_id, order_index)
  values (v_collection_id, v_new_workout_id, v_next_index);
end;
$$;

revoke all on function add_workout_to_collection(uuid, uuid) from public;
grant execute on function add_workout_to_collection(uuid, uuid) to authenticated;

create or replace function clone_collection(p_slug text)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_source_id uuid;
  v_source_name text;
  v_source_description text;
  v_new_collection_id uuid;
  cw_rec record;
  v_new_workout_id uuid;
  v_idx int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, name, description
  into v_source_id, v_source_name, v_source_description
  from collections
  where share_slug = p_slug and is_public = true;

  if v_source_id is null then
    raise exception 'Collection not found';
  end if;

  insert into collections (user_id, name, description)
  values (auth.uid(), 'Copy of ' || v_source_name, v_source_description)
  returning id into v_new_collection_id;

  for cw_rec in
    select workout_id, order_index
    from collection_workouts
    where collection_id = v_source_id
    order by order_index
  loop
    v_new_workout_id := copy_workout_structure(cw_rec.workout_id);
    if v_new_workout_id is null then
      continue; -- deleted / inaccessible workout — skip cleanly
    end if;

    insert into collection_workouts (collection_id, workout_id, order_index)
    values (v_new_collection_id, v_new_workout_id, v_idx);

    v_idx := v_idx + 1;
  end loop;

  return v_new_collection_id;
end;
$$;

revoke all on function clone_collection(text) from public;
grant execute on function clone_collection(text) to authenticated;
