# Chronicon — Architecture

## Overview

Chronicon is a Next.js 16 App Router application backed by Supabase. The server renders pages and runs database mutations via server actions; the client owns timer state and builder drag-and-drop. There is no separate API layer — Supabase is accessed directly from server components and server actions using the `@supabase/ssr` package.

---

## Request Flow

```
Browser
  │
  ▼
proxy.ts  ← Next.js 16 middleware equivalent
  │  Reads session cookie (optimistic, no network call)
  │  Refreshes JWT if stale; clears cookies if refresh token invalid
  │  Redirects unauthenticated requests to /login (protected routes only)
  │
  ▼
Server Component (page.tsx)
  │  Creates Supabase server client (reads cookies)
  │  Calls supabase.auth.getUser() for authoritative auth check
  │  Fetches page data directly from Postgres via Supabase client
  │  Returns rendered HTML + RSC payload
  │
  ▼
Client Component (if needed)
     Hydrates with server-fetched data as props
     Manages local UI state (builder, timer, forms)
     Calls server actions for mutations
```

---

## Authentication

Supabase Auth with SSR cookie-based sessions (`@supabase/ssr`).

```
Login / Register
  │
  ▼
supabase.auth.signInWithPassword() / signUp()   [client-side, auth-form.tsx]
  │  Supabase sets httpOnly session cookies
  │
  ▼
proxy.ts (every subsequent request)
  │  supabase.auth.getSession() — reads session from cookie, refreshes if needed
  │  On refresh_token_not_found error → signOut() to clear dead cookies
  │
  ▼
Server components
     supabase.auth.getUser() — authoritative check (network call to Supabase)
     RLS enforces row-level ownership on every DB query
```

**Two-level auth check pattern:**
- `proxy.ts` uses `getSession()` (fast, cookie-only) to gate routes at the edge
- Server components use `getUser()` (authoritative, hits Supabase) before any data access

This prevents a compromised cookie from bypassing RLS, while keeping the middleware fast.

**Supabase client rule:** The client must be created inside request handlers, never at module scope. Module-scope clients would share cookies across requests in the Node.js server process.

---

## Route Groups

```
app/
├── page.tsx                    Landing page (public)
├── (auth)/                     Auth pages — no sidebar, card-centred layout
│   ├── layout.tsx
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── (app)/                      Authenticated app — sidebar layout
│   ├── layout.tsx              Fetches user + profile, renders SidebarNav
│   ├── dashboard/
│   ├── workouts/
│   ├── collections/
│   ├── history/
│   ├── exercises/
│   └── profile/                Change email/password, delete account
├── about/                       Public marketing page — no layout wrapper
├── try/                        Guest mode — no layout wrapper
│   ├── page.tsx                Guest builder
│   └── run/page.tsx            Guest timer
├── w/[slug]/                   Public shared workout — no layout wrapper
│   ├── page.tsx
│   └── run/page.tsx
└── c/[slug]/                   Public shared collection — no layout wrapper
    ├── page.tsx
    └── workout/[index]/run/page.tsx
```

Route groups (`(auth)`, `(app)`) share layouts without affecting the URL. Pages outside these groups (`/about`, `/try`, `/w/`, `/c/`) render in the root layout (fonts, theme, toaster) but have no sidebar.

---

## Data Layer

### Supabase / PostgreSQL

All data lives in Supabase Postgres. Row-level security (RLS) is enabled on every table — the application never bypasses it.

```
profiles              1──1   auth.users
workouts              N──1   auth.users
  workout_phases      N──1   workouts
    workout_blocks    N──1   workout_phases
      block_exercises N──1   workout_blocks
                      N──1   exercises
workout_sessions      N──1   auth.users
                      N──1   workouts  (nullable — survives workout deletion)
exercises             (library rows: is_custom=false, created_by=null)
                      (custom rows:  is_custom=true,  created_by=user_id)
collections           N──1   auth.users
collection_workouts   N──1   collections
                      N──1   workouts
```

### RLS policy patterns

| Table | Who can read | Who can write |
|---|---|---|
| `exercises` | Library rows: everyone (incl. anon). Custom rows: owner or if in a public workout/collection | Owner only |
| `workouts` | Owner always. Public (`is_public=true`): everyone | Owner only |
| `collections` | Owner always. Public: everyone | Owner only |
| `collection_workouts` | Follows parent collection visibility | Owner (via collection) |
| `workout_sessions` | Owner only | Owner only |
| `profiles` | Owner only | Owner only |

### Server actions

Mutations go through Next.js server actions (`'use server'`). Each action calls the shared `requireUser()` helper (`lib/actions/require-user.ts`), which creates a Supabase client and calls `getUser()` to verify identity in one place, then performs the mutation. RLS provides a second enforcement layer even if the action is called directly.

```
lib/actions/
  workouts.ts     createWorkout, updateWorkout, deleteWorkout, setWorkoutPublic, cloneWorkout
  sessions.ts     saveSession, deleteSession
  exercises.ts    createExercise, deleteExercise
  collections.ts  createCollection, updateCollection, deleteCollection,
                  setCollectionPublic, addWorkoutToCollection,
                  removeWorkoutFromCollection, cloneCollection, getPublicCollection
  account.ts      deleteAccount
  require-user.ts requireUser() — shared auth-check + client-creation helper
```

### Input validation

Mutations that accept structured input (e.g. `createWorkout`/`updateWorkout`) validate it against a zod schema before hitting the database. `lib/validation/parse.ts` exports `parseOrThrow(schema, data)`, which wraps `schema.safeParse()` and throws a single readable `Error` on failure instead of a raw `ZodError`, so every server action fails the same way. Schemas live alongside it in `lib/validation/` (`workout.ts`, `exercise.ts`).

### Atomic nested writes

Mutations that write a nested structure (workout phases → blocks → exercises) run inside a Postgres `plpgsql` function called via `supabase.rpc(...)`, not a sequence of client-side `insert()` calls. A top-level RPC call is a single transaction, so a failure partway through rolls back cleanly instead of leaving orphaned rows.

```
save_workout(p_workout_id, p_name, p_description, p_phases)   — create or update a workout (015_atomic_workout_save.sql)
copy_workout_structure(p_source_workout_id)                   — shared deep-copy helper, security invoker (016_atomic_collection_copy.sql)
add_workout_to_collection(p_collection_id, p_workout_id)       — calls copy_workout_structure(), then links it
clone_collection(p_slug)                                       — calls copy_workout_structure() per workout
delete_user_account()                                          — 014_delete_user_function.sql
```

All of these use `security invoker`, so RLS still governs which rows the caller can see/copy — the RPC only buys atomicity, not elevated privilege.

---

## Workout Builder

The builder is a pure client component (`WorkoutBuilder` / `GuestWorkoutBuilder`). All state lives in React (`useState`). On save, the state is serialised and sent to a server action.

```
BuilderWorkout (React state)
  └── BuilderPhase[]          warmup / main / cooldown
        └── BuilderBlock[]    block type + config JSONB
              └── BuilderBlockExercise[]   exercise ref + per-exercise overrides
```

**Drag-and-drop** is handled by dnd-kit. Two drag sources:
- `sidebar:` prefix — dragging from the exercise list into a block
- `bex:` prefix — reordering exercises within or between blocks

**Mobile** — the exercise sidebar is hidden (`hidden md:block`). A per-block "+ Add exercise" button opens a bottom Sheet containing the same `ExerciseSidebar` component with an `onTapAdd` tap handler instead of drag.

**Guest builder** (`GuestWorkoutBuilder`) is identical to the auth builder except:
- No save/update server actions
- No share dialog or delete button
- "Run Workout" button serialises the workout to `sessionStorage` and navigates to `/try/run`
- Only library exercises are fetched (server page filters `is_custom = false`)

---

## Timer

### Flattening

Before a workout runs, `flattenWorkout()` (`lib/timer/flatten.ts`) converts the nested `WorkoutWithStructure` into a flat `TimerStep[]`. Each step has a fixed duration, exercise name, labels, and flags (`isRest`, `isReps`).

This means the timer only ever works with a simple array — no block type logic at runtime.

### State machine

```
idle ──startCountdown()──► countdown ──tick() × 3──► running
                                                        │
                                              pause() ◄─┤─► resume()
                                                        │
                                              advance() ─► (next step)
                                                        │
                                              advance() ─► done  (last step)
```

Managed by Zustand (`lib/timer/store.ts`). A single `tick()` action is called by `setInterval` every second in `ActiveWorkout`. The store advances steps, fires `done` when the last step ends, and handles countdown separately.

**Deadline-anchored, not decrement-based.** `timeLeft` is derived from a wall-clock deadline (`stepEndsAt = Date.now() + duration * 1000`), not decremented per tick. This matters because `setInterval` ticks can arrive late — a backgrounded or throttled mobile tab can miss several seconds (or steps) between ticks. On each `tick()`, the store loops `while (now >= stepEndsAt)`, calling `advance()` for every step that has genuinely elapsed and carrying the deadline forward from the *previous ideal deadline* rather than from `now`, so lag never accumulates or silently skips a step. `resume()` re-anchors `stepEndsAt` to `Date.now() + timeLeft * 1000` so paused time never counts against the deadline.

### Snapshot / resume

On every step boundary and on pause, the store writes a snapshot to `localStorage`:

```
key:   chronicon:timer:<workoutId>
value: { workoutId, stepIndex, timeLeft, startedAt, savedAt }
```

On mount, `ActiveWorkout` reads the snapshot. If valid (<24h old) and the step index is within bounds, it shows a "Resume / Start fresh" prompt.

**`guestMode` flag** — set in the store via `load(workout, guestMode)`. When true, all `writeSnapshot` / `removeSnapshot` calls inside the store are skipped. The flag lives in the store (not just the component) so snapshot writes are suppressed even during internal store operations like `pause()` and `advance()`.

### Audio

`lib/audio/beeps.ts` uses the Web Audio API to synthesise beep tones at runtime — no audio files to load. Four cues: `go`, `rest`, `tick`, `done`.

---

## Guest Mode

Guest mode allows building and running a workout without a Supabase session.

```
/try (server component)
  │  Fetches library exercises with anon Supabase client
  │  Renders GuestWorkoutBuilder (client component)
  │
  ▼
User builds workout in React state
  │
  ▼
"Run Workout" clicked
  │  buildWorkoutPayload() → WorkoutWithStructure-shaped object (fake UUIDs, no DB write)
  │  sessionStorage.setItem('chronicon:guest-workout', JSON.stringify(payload))
  │  router.push('/try/run')
  │
  ▼
/try/run (client component)
  │  useEffect: reads sessionStorage → parses payload
  │  If missing: router.replace('/try')
  │
  ▼
<ActiveWorkout workout={payload} guestMode={true} />
  │  store.load(workout, true)  → guestMode=true in store
  │  No snapshot reads, no snapshot writes
  │  On completion: WorkoutComplete shows upsell (Create account / Log in)
```

**Security properties of `sessionStorage`:**
- Origin-scoped — other domains cannot read it
- Tab-scoped — not shared across tabs, cleared when tab closes
- Never sent to the server — unlike cookies
- Contains only workout structure (exercise names, block config) — no credentials

---

## Collections

Collections are server-managed groupings of workouts with their own `share_slug`.

```
Collection (owner)
  ├── Can be made public (is_public=true)
  ├── Public URL: /c/[share_slug]
  └── CollectionWorkout[] (ordered by order_index)
        └── → Workout (deep-copied into the caller's own workout row)
```

Public collections expose their workouts for viewing and running without auth. The guest timer for collection workouts (`/c/[slug]/workout/[index]/run`) fetches the full workout structure server-side (using the anon client — RLS permits this for public collections) and passes it to `<ActiveWorkout guestMode />`.

**Adding or cloning always deep-copies the workout**, it never links to the source record. `addWorkoutToCollection` (adding a workout to a collection) and `cloneCollection` (copying a whole collection) both call the `copy_workout_structure()` RPC, which inserts a brand-new `workouts` row (+ its phases/blocks/exercises) owned by the caller before linking it via `collection_workouts`. This means each collection's workouts are independent copies — editing a workout in one collection never affects the same workout elsewhere. `cloneCollection` additionally creates a new `Collection` row ("Copy of ...") and skips any source workout that's been deleted or is no longer accessible, rather than failing the whole clone.

Cloning a single public workout (`cloneWorkout`, outside a collection) follows the same deep-copy principle but takes a different path: it reads the full public workout structure client-side (one nested `select`), then calls `createWorkout()` — i.e. the `save_workout` RPC — to write it as a new, independent workout owned by the caller ("Copy of ...").

---

## Sharing Model

```
Workout  ──is_public=true──►  /w/[share_slug]       view page
                          ──►  /w/[share_slug]/run    guest timer

Collection ──is_public=true──►  /c/[share_slug]              view page
                            ──►  /c/[share_slug]/workout/N/run  guest timer per workout
```

`share_slug` values are 8-character hex strings generated by a Postgres trigger on insert (`substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)`). They are assigned at creation and never change.

The exercises RLS policy allows anonymous reads of exercises that appear in public workouts or workouts belonging to public collections — this prevents "Unknown exercise" on public share pages.

---

## Key Constraints

- **No middleware.ts** — Next.js 16 uses `proxy.ts` at the project root instead
- **Supabase client scope** — always created inside the handler/action, never at module level
- **shadcn on base-ui** — uses render prop pattern, not `asChild`
- **`crypto.randomUUID()`** — used for all client-side ID generation; no `Math.random()` fallback
- **No PWA / offline** — always-online assumption; no service worker
- **No embedded video** — exercise videos are YouTube links only (`video_url`); no iframe/player
