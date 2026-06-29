# Chronicon

A fitness timer web app. Build workouts with a drag-and-drop interface and run them with a guided interval timer — no stopwatch required.

## Features

- **Workout builder** — drag-and-drop blocks (HIIT, Tabata, Circuit, AMRAP, EMOM, Straight Sets, Free-form) across Warm-Up / Main / Cool-Down phases
- **Interval timer** — countdown ring, audio cues, pause/resume, back-step, and a 3-second countdown before each session
- **Guest mode** — build and run a workout without an account; session is not saved
- **Session history** — completed sessions logged with notes, duration, and an activity heatmap
- **Exercise library** — ~300 seeded exercises with muscle heatmap, instructions, and YouTube links; create custom exercises too
- **Sharing** — make any workout or collection public and share a link; recipients can run it as a guest or copy it to their own account
- **Collections** — group workouts into named programs (useful for trainers sharing plans with students)
- **Resume** — closing the tab mid-workout saves a snapshot; reopening prompts you to continue or start fresh

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Turbopack)
- [Supabase](https://supabase.com) (auth, PostgreSQL, RLS)
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- [dnd-kit](https://dndkit.com) for drag-and-drop
- [Zustand](https://zustand-demo.pmnd.rs) for timer state
- [Framer Motion](https://www.framer.com/motion) for animations
- Web Audio API for beep cues (no library)

## Running locally

**Prerequisites:** Node.js 18+, [Supabase CLI](https://supabase.com/docs/guides/cli)

```bash
# Install dependencies
npm install

# Start local Supabase (Docker required)
supabase start

# Apply migrations
supabase db reset

# Copy the local keys printed by `supabase start` into .env.local
cp .env.example .env.local   # then fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying

1. Create a [Supabase](https://supabase.com) project and run the migrations in `supabase/migrations/` against it in order (001 → 013) via the SQL Editor
2. Get your project URL and anon key from **Project Settings → API**
3. Deploy to [Vercel](https://vercel.com) — import the repo and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. In Supabase → **Authentication → URL Configuration**, set the Site URL and add a redirect URL pointing to your Vercel domain

## Disclaimer

This project is provided as-is, without warranty of any kind. See the [LICENSE](LICENSE) file for details.
