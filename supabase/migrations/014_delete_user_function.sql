-- Chronicon — Delete user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Custom exercises use ON DELETE SET NULL; delete them explicitly
  DELETE FROM exercises WHERE created_by = v_user_id AND is_custom = true;
  -- CASCADE handles: profiles, workouts→phases→blocks→block_exercises, workout_sessions, collections→collection_workouts
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
