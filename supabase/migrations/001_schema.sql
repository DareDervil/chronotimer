-- ============================================================
-- Chronicon — Database Schema
-- ============================================================

-- ENUMS
create type phase_type as enum ('warmup', 'main', 'cooldown');
create type block_type as enum ('hiit', 'amrap', 'emom', 'tabata', 'circuit', 'straight_sets');
create type muscle_group as enum ('upper_body', 'lower_body', 'core', 'full_body');
create type exercise_category as enum ('warmup', 'cardio', 'strength', 'mobility');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view and edit their own profile"
  on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- EXERCISES
-- ============================================================
create table exercises (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category      exercise_category not null,
  muscle_groups muscle_group[] not null default '{}',
  description   text,
  instructions  text,
  is_custom     boolean not null default false,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

alter table exercises enable row level security;
-- Library exercises (is_custom=false) visible to all authenticated users
create policy "Library exercises visible to all authenticated users"
  on exercises for select using (
    auth.uid() is not null and (not is_custom or created_by = auth.uid())
  );
create policy "Users can insert their own custom exercises"
  on exercises for insert with check (auth.uid() = created_by and is_custom = true);
create policy "Users can update their own custom exercises"
  on exercises for update using (auth.uid() = created_by and is_custom = true);
create policy "Users can delete their own custom exercises"
  on exercises for delete using (auth.uid() = created_by and is_custom = true);

-- ============================================================
-- WORKOUTS
-- ============================================================
create table workouts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  is_public   boolean not null default false,
  share_slug  text unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table workouts enable row level security;
create policy "Users can manage their own workouts"
  on workouts for all using (auth.uid() = user_id);
create policy "Public workouts visible to all"
  on workouts for select using (is_public = true);

-- Auto-generate share_slug when workout becomes public
create or replace function generate_share_slug()
returns trigger language plpgsql as $$
begin
  if new.is_public = true and new.share_slug is null then
    new.share_slug := lower(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_share_slug
  before insert or update on workouts
  for each row execute procedure generate_share_slug();

-- ============================================================
-- WORKOUT PHASES
-- ============================================================
create table workout_phases (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  phase_type  phase_type not null,
  order_index integer not null default 0
);

alter table workout_phases enable row level security;
create policy "Users can manage phases of their workouts"
  on workout_phases for all using (
    exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())
  );
create policy "Public workout phases visible to all"
  on workout_phases for select using (
    exists (select 1 from workouts w where w.id = workout_id and w.is_public = true)
  );

-- ============================================================
-- WORKOUT BLOCKS
-- ============================================================
create table workout_blocks (
  id          uuid primary key default gen_random_uuid(),
  phase_id    uuid not null references workout_phases(id) on delete cascade,
  block_type  block_type not null,
  config      jsonb not null default '{}',
  order_index integer not null default 0
);

alter table workout_blocks enable row level security;
create policy "Users can manage blocks of their workouts"
  on workout_blocks for all using (
    exists (
      select 1 from workout_phases p
      join workouts w on w.id = p.workout_id
      where p.id = phase_id and w.user_id = auth.uid()
    )
  );
create policy "Public workout blocks visible to all"
  on workout_blocks for select using (
    exists (
      select 1 from workout_phases p
      join workouts w on w.id = p.workout_id
      where p.id = phase_id and w.is_public = true
    )
  );

-- ============================================================
-- BLOCK EXERCISES
-- ============================================================
create table block_exercises (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references workout_blocks(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  duration_s  integer,
  reps        integer,
  sets        integer,
  rest_after_s integer not null default 0,
  order_index integer not null default 0
);

alter table block_exercises enable row level security;
create policy "Users can manage block exercises of their workouts"
  on block_exercises for all using (
    exists (
      select 1 from workout_blocks b
      join workout_phases p on p.id = b.phase_id
      join workouts w on w.id = p.workout_id
      where b.id = block_id and w.user_id = auth.uid()
    )
  );
create policy "Public workout block exercises visible to all"
  on block_exercises for select using (
    exists (
      select 1 from workout_blocks b
      join workout_phases p on p.id = b.phase_id
      join workouts w on w.id = p.workout_id
      where b.id = block_id and w.is_public = true
    )
  );

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
create table workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  workout_id   uuid references workouts(id) on delete set null,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  notes        text
);

alter table workout_sessions enable row level security;
create policy "Users can manage their own sessions"
  on workout_sessions for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index workouts_user_id_idx on workouts(user_id);
create index workouts_share_slug_idx on workouts(share_slug) where share_slug is not null;
create index workout_phases_workout_id_idx on workout_phases(workout_id);
create index workout_blocks_phase_id_idx on workout_blocks(phase_id);
create index block_exercises_block_id_idx on block_exercises(block_id);
create index workout_sessions_user_id_idx on workout_sessions(user_id);
create index exercises_category_idx on exercises(category);
