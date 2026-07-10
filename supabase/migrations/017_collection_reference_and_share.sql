-- ============================================================
-- Chronicon — Collection reference/copy semantics + share-publicizes-workouts
--
-- Two related fixes to collection membership:
--
-- 1. add_workout_to_collection previously always deep-copied the
--    source workout via copy_workout_structure(), regardless of who
--    owned it. Adding your OWN workout to a collection created a
--    disconnected duplicate workout row (shown twice on the
--    dashboard/workouts list, and never cleaned up when the
--    original was deleted, since it wasn't actually the same row).
--    Fixed by branching on ownership:
--      - same owner  -> store a direct reference to the existing
--        workout_id. Deleting that workout now cascades out of the
--        collection for free via collection_workouts' existing
--        `on delete cascade` FK.
--      - different owner (public workout only) -> still deep-copy,
--        preserving today's "your copy survives the original being
--        deleted" behavior for cross-user sharing, matching
--        cloneWorkout()'s semantics.
--    This also means the unique(collection_id, workout_id) constraint
--    on collection_workouts finally does its job for same-owner adds
--    (previously every add used a fresh copy id, so duplicates were
--    never actually caught).
--
-- 2. set_collection_public (new) lets sharing a collection also
--    publicize its member workouts in the same transaction, so a
--    public collection never silently hides private-workout members
--    from viewers. Every workout in a caller's collection is
--    guaranteed to be owned by that caller after fix #1 (same-owner
--    adds are references to their own workouts; cross-owner adds are
--    deep copies also owned by them), so this never touches another
--    user's workout.
--
-- No existing rows are altered by this migration — both functions
-- only change behavior for future calls.
-- ============================================================

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
  v_owner_id uuid;
  v_is_public boolean;
  v_target_workout_id uuid;
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

  -- RLS (via security invoker) filters this to workouts the caller
  -- owns or that are public. No row => caller can't see it.
  select user_id, is_public into v_owner_id, v_is_public
  from workouts
  where id = p_workout_id;

  if v_owner_id is null then
    raise exception 'Workout not found';
  end if;

  if v_owner_id = auth.uid() then
    -- Same owner: reference the existing workout directly, no copy.
    v_target_workout_id := p_workout_id;
  elsif v_is_public then
    -- Different owner: deep-copy so it stays independent of the original.
    v_target_workout_id := copy_workout_structure(p_workout_id);
    if v_target_workout_id is null then
      raise exception 'Workout not found';
    end if;
  else
    raise exception 'Workout not found';
  end if;

  select coalesce(max(order_index) + 1, 0) into v_next_index
  from collection_workouts
  where collection_id = v_collection_id;

  insert into collection_workouts (collection_id, workout_id, order_index)
  values (v_collection_id, v_target_workout_id, v_next_index);
end;
$$;

create or replace function set_collection_public(
  p_collection_id uuid,
  p_is_public boolean,
  p_make_workouts_public boolean default false
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from collections where id = p_collection_id and user_id = auth.uid()
  ) then
    raise exception 'Collection not found';
  end if;

  if p_is_public and p_make_workouts_public then
    update workouts
    set is_public = true
    where user_id = auth.uid()
      and is_public = false
      and id in (
        select workout_id from collection_workouts where collection_id = p_collection_id
      );
  end if;

  update collections
  set is_public = p_is_public
  where id = p_collection_id and user_id = auth.uid();
end;
$$;

revoke all on function set_collection_public(uuid, boolean, boolean) from public;
grant execute on function set_collection_public(uuid, boolean, boolean) to authenticated;
