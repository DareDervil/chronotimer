-- ============================================================
-- Chronicon — Replace custom muscle enums with wger text arrays
--             and add equipment column
-- ============================================================

-- 1. Drop columns that reference the custom enums
alter table exercises drop column muscle_groups;
alter table exercises drop column primary_muscles;
alter table exercises drop column secondary_muscles;

-- 2. Drop the custom enums (no longer needed)
drop type if exists muscle_group;
drop type if exists muscle_name;

-- 3. Add new schema-agnostic columns (store wger Latin muscle names)
alter table exercises
  add column primary_muscles   text[] not null default '{}',
  add column secondary_muscles text[] not null default '{}',
  add column equipment         text[] not null default '{}';
