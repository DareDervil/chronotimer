-- Denormalize workout name onto sessions so history survives workout deletion
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS workout_name text;
