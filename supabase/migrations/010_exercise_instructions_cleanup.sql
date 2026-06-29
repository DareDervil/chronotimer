-- ─── Step 1: Add video_url column ─────────────────────────────────────────────
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url text;

-- ─── Step 2: Extract YouTube URLs from description into video_url ──────────────
UPDATE exercises
SET video_url = (
  regexp_match(
    description,
    'https?://(?:www\.)?(?:youtube\.com/watch\?[^\s]+|youtu\.be/[^\s.]+)'
  )
)[1]
WHERE description ~* 'https?://(?:www\.)?(?:youtube\.com|youtu\.be)'
  AND video_url IS NULL;

-- ─── Step 3: Null out useless placeholder descriptions ────────────────────────
-- These say nothing useful — no text, no URL we could extract
UPDATE exercises
SET description = NULL
WHERE TRIM(description) ILIKE 'View the video to undestand the exercise'
   OR TRIM(description) ILIKE 'View the video to understand the exercise';

-- ─── Step 4: Strip inline video references from descriptions that have real text
-- Removes trailing "See the video: <url>", "Resources: • ... YouTube video: <url>", etc.
UPDATE exercises
SET description = TRIM(
  regexp_replace(
    regexp_replace(
      description,
      '\s*(?:See (?:this )?(?:instructive |instructional )?video[^:]*:|Resources:[^•]*•[^•]*YouTube video:)\s*https?://\S+\s*\.?',
      '',
      'gi'
    ),
    '\s*https?://\S+\s*',  -- catch any remaining bare URLs
    '',
    'gi'
  )
)
WHERE description ~* 'https?://'
  AND description IS NOT NULL;

-- ─── Step 5: Promote clean descriptions → instructions (where instructions missing)
UPDATE exercises
SET instructions = description
WHERE instructions IS NULL
  AND description IS NOT NULL
  AND TRIM(description) != '';

-- ─── Step 6a: Strip dangling "See the video:" / "click here:" suffixes ──────────
-- Some entries had their URL removed but left trailing label text
UPDATE exercises
SET instructions = TRIM(
  regexp_replace(
    instructions,
    '\s*(?:For a detailed video[^:]*,\s*click here|See the (?:attached )?(?:youtube )?video|See the video)\s*:?\s*\.?\s*$',
    '',
    'gi'
  )
)
WHERE instructions ~* '(?:click here|see the.*video)\s*:?\s*\.?\s*$';

-- ─── Step 6: Clear description where it's now redundant with instructions ──────
-- Only clear it if the description IS the instructions (wger exercises).
-- Our custom seeds have a short description AND separate instructions — keep those.
-- Indicator: custom seeds always have is_custom = false but were inserted with both fields.
-- Safe rule: if instructions = description exactly, the description added no extra value → clear it.
UPDATE exercises
SET description = NULL
WHERE instructions = description
  AND is_custom = false;
