-- Collections: named ordered groups of workouts (for trainers, programs, etc.)

create table collections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  is_public    boolean not null default false,
  share_slug   text unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table collection_workouts (
  id             uuid primary key default gen_random_uuid(),
  collection_id  uuid not null references collections(id) on delete cascade,
  workout_id     uuid not null references workouts(id) on delete cascade,
  order_index    int not null default 0,
  unique(collection_id, workout_id)
);

-- Auto-generate share_slug on insert
create or replace function generate_collection_share_slug()
returns trigger language plpgsql as $$
begin
  if new.share_slug is null then
    new.share_slug := substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);
  end if;
  return new;
end;
$$;

create trigger trg_collection_share_slug
  before insert on collections
  for each row execute function generate_collection_share_slug();

-- Updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_collections_updated_at
  before update on collections
  for each row execute function set_updated_at();

-- RLS
alter table collections enable row level security;
alter table collection_workouts enable row level security;

-- collections: owner full access
create policy "Owner manages collections"
  on collections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- collections: public ones readable by anyone
create policy "Public collections readable by all"
  on collections for select
  using (is_public = true);

-- collection_workouts: owner full access (via collection ownership)
create policy "Owner manages collection workouts"
  on collection_workouts for all
  using (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- collection_workouts: readable when collection is public
create policy "Public collection workouts readable by all"
  on collection_workouts for select
  using (
    exists (
      select 1 from collections c
      where c.id = collection_id and c.is_public = true
    )
  );

-- Allow workouts/phases/blocks/exercises to be read when part of a public collection
-- (extends existing 012 policy concept — workouts in public collections are readable)
drop policy if exists "Exercises readable by all with custom privacy" on exercises;
create policy "Exercises readable by all with custom privacy"
  on exercises for select using (
    not is_custom
    or created_by = auth.uid()
    or exists (
      select 1 from block_exercises be
      join workout_blocks wb on wb.id = be.block_id
      join workout_phases wp on wp.id = wb.phase_id
      join workouts w on w.id = wp.workout_id
      where be.exercise_id = exercises.id
        and (
          w.is_public = true
          or exists (
            select 1 from collection_workouts cw
            join collections c on c.id = cw.collection_id
            where cw.workout_id = w.id and c.is_public = true
          )
        )
    )
  );

-- Grants
grant select, insert, update, delete on collections to authenticated;
grant select, insert, update, delete on collection_workouts to authenticated;
grant select on collections to anon;
grant select on collection_workouts to anon;
