# Proposed Improvements

Follow-ups from a v1.0 codebase review.

## 1. Transaction safety for multi-table writes — ✅ DONE (deployed)
`lib/actions/workouts.ts` (`insertStructure`), `lib/actions/collections.ts` (`addWorkoutToCollection`, `cloneCollection`) performed sequential inserts across `workouts` → `workout_phases` → `workout_blocks` → `block_exercises` with no rollback. A failure partway through left orphaned rows.
- Fixed via atomic `security invoker` Postgres functions (`save_workout`, `copy_workout_structure`, `add_workout_to_collection`, `clone_collection`) called through `supabase.rpc(...)`. Migrations: `015_atomic_workout_save.sql`, `016_atomic_collection_copy.sql`. Verified locally (success paths, auth/ownership guards, forced-failure rollback with zero orphaned rows) and applied to production via the Supabase SQL Editor. Deployed to Vercel.

## 2. Timer drift — ✅ DONE (deployed)
`components/timer/active-workout.tsx` ticked via `setInterval(tick, 1000)`, decrementing a counter rather than comparing against a wall-clock timestamp. Long AMRAP/EMOM blocks (10+ min) could drift, especially if the tab was throttled/backgrounded.
- Fixed in `lib/timer/store.ts`: `timeLeft` is now derived each tick from a wall-clock deadline (`stepEndsAt`), with `advance()` carrying the ideal deadline forward on backgrounded/late ticks instead of resetting drift at each step boundary. Verified with a behavioral test harness (mocked clock driving the real store) proving correct self-correction, multi-step background catch-up, and clean pause/resume — confirmed the same tests fail against the pre-fix code. Deployed to Vercel.

## 3. Input validation — ✅ DONE (implemented, pending deploy)
`zod` is a dependency but unused in `lib/actions/*`. Inputs like workout `name`, block `config` (jsonb) go to the DB with only `.trim()` — no schema validation.
- Added `lib/validation/workout.ts` (`saveWorkoutSchema` — covers `SaveWorkoutInput` incl. nested `BlockConfig`, block/phase enums, per-exercise numeric ranges and `exercise_id` uuid format) and `lib/validation/exercise.ts` (`createExerciseSchema` — covers `createCustomExercise`'s payload).
- Wired into `createWorkout`/`updateWorkout` (`lib/actions/workouts.ts`) and `createCustomExercise` (`lib/actions/exercises.ts`) via a shared `parseOrThrow()` helper (`lib/validation/parse.ts`) that throws a readable `Error` on invalid input — same throw-on-failure contract as every other action.
- Verified: `tsc --noEmit`, lint (22 problems, unchanged — no new issues), and `npm run build` all clean. Ran a real behavioral test (compiled schemas + Node, no Supabase/dev server needed since validation runs before any DB call): 14/14 assertions passed, covering both valid-payload acceptance (with whitespace-trimming) and rejection of empty names, negative durations, bogus enum values, malformed `exercise_id`, and wrong-typed `config` fields.
- No new migration needed; pure app-code change, ships with the next Vercel deploy.

## 4. Auth-check duplication — ✅ DONE (implemented, pending deploy)
Every action in `lib/actions/*.ts` repeated:
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')
```
- Extracted into `lib/actions/require-user.ts`'s `requireUser()`, used across all 19 call sites in `workouts.ts`, `collections.ts`, `exercises.ts`, `sessions.ts`, `account.ts`.
- As a related cleanup, `deleteAccount` (`lib/actions/account.ts`) was normalized to throw on failure like every other action, instead of returning `{ error }`. Its caller (`delete-account-section.tsx`) was updated to match.
- Verified: `tsc --noEmit` clean, lint has zero new issues (22 problems, down from 23), and a real end-to-end test against a local Supabase stack confirmed `requireUser()` both accepts a valid session (returns the correct user) and rejects a forged/invalid one (throws `Not authenticated`) inside an actual Next.js request — no code-only change, since this is a pure refactor with no new runtime behavior.
- No new migration needed; pure app-code change, ships with the next Vercel deploy.

## 5. Type safety in collections.ts — ✅ DONE (resolved as a side effect of #1)
`cloneCollection` / `addWorkoutToCollection` used `any` casts and `eslint-disable` comments for the deep-copy logic — exactly where the data shape (phases → blocks → exercises) was most complex and most worth typing.
- The manual deep-copy loops (and their `any` casts) were deleted entirely when #1 moved the logic into Postgres RPC calls — nothing left to type.

## 6. No test suite
No automated tests found. Given this is a timer people rely on mid-workout, at minimum: unit tests for `lib/timer/flatten.ts` (per block type) and `lib/timer/store.ts` (state transitions).

## 7. Naming inconsistency — ACCEPTED, no change
Page metadata/titles say "Chronotimer" while the project/repo is "Chronicon."
- Confirmed intentional: Chronicon is the internal/repo name, Chronotimer is the public brand name. No action needed.

## 8. No rate limiting on server actions
Login/sign-up/password-reset abuse is already covered by Supabase's built-in `auth.rate_limit` (`supabase/config.toml`). But mutating server actions (`createWorkout`, `cloneCollection`, `addWorkoutToCollection`, `createCustomExercise`, `saveSession`, etc.) have no throttling — an authenticated user could script rapid repeated calls.
- Lower priority than #3: these operations aren't individually expensive (no email/SMS/paid API/LLM calls), and RLS scopes writes to the caller's own rows. The real risk is availability (DB connection/CPU exhaustion from a scripted loop) rather than cost or data exposure — `cloneCollection`/`addWorkoutToCollection` also read *public* workouts, so abuse there adds read load against other users' content.
- Options: Vercel's built-in Firewall/rate limiting (project settings, no code) as a first line, and/or `@upstash/ratelimit` wrapped around specific mutating actions (or inside `requireUser()`) for per-user limits.

---
*Generated from a codebase review — see conversation history for full context.*
