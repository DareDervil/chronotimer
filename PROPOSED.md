# Proposed Improvements

Follow-ups from a v1.0 codebase review. Nothing here has been implemented — for discussion/prioritization only.

## 1. Transaction safety for multi-table writes
`lib/actions/workouts.ts` (`insertStructure`), `lib/actions/collections.ts` (`addWorkoutToCollection`, `cloneCollection`) perform sequential inserts across `workouts` → `workout_phases` → `workout_blocks` → `block_exercises` with no rollback. A failure partway through leaves orphaned rows.
- Options: wrap in a Postgres function (`security definer` RPC) so it's atomic, or add manual cleanup on catch.

## 2. Timer drift
`components/timer/active-workout.tsx` ticks via `setInterval(tick, 1000)`, decrementing a counter rather than comparing against a wall-clock timestamp. Long AMRAP/EMOM blocks (10+ min) can drift, especially if the tab is throttled/backgrounded.
- Fix: compute `timeLeft` from `startedAt` + elapsed real time each tick instead of decrementing.

## 3. Input validation
`zod` is a dependency but unused in `lib/actions/*`. Inputs like workout `name`, block `config` (jsonb) go to the DB with only `.trim()` — no schema validation.
- Add zod schemas for `SaveWorkoutInput`, `BlockConfig`, exercise creation payload.

## 4. Auth-check duplication
Every action in `lib/actions/*.ts` repeats:
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')
```
- Extract a shared `requireUser(supabase)` helper.

## 5. Type safety in collections.ts
`cloneCollection` / `addWorkoutToCollection` use `any` casts and `eslint-disable` comments for the deep-copy logic — exactly where the data shape (phases → blocks → exercises) is most complex and most worth typing.
- Reuse `WorkoutWithStructure` typing instead of `any`.

## 6. No test suite
No automated tests found. Given this is a timer people rely on mid-workout, at minimum: unit tests for `lib/timer/flatten.ts` (per block type) and `lib/timer/store.ts` (state transitions).

## 7. Naming inconsistency
Page metadata/titles say "Chronotimer" (`app/layout.tsx`, `app/(app)/dashboard/page.tsx`, etc.) while the project/repo is "Chronicon". Pick one.

---
*Generated from a codebase review — see conversation history for full context.*
