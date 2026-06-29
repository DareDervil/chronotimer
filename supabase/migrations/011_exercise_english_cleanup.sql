-- ============================================================
-- Chronicon — Remove foreign-language exercises and fix typography
-- Root cause: wger community contributors tagged non-English
-- exercises as language=2 (English). This migration removes them
-- and normalises Unicode typography in descriptions.
-- ============================================================

-- 1. Delete exercises with non-ASCII names (Spanish, Portuguese, etc.)
DELETE FROM exercises
WHERE is_custom = false
  AND name ~ '[^\x00-\x7F]';

-- 2. Delete known junk entries (Portuguese placeholder descriptions,
--    names that are not real exercise names)
DELETE FROM exercises
WHERE is_custom = false
  AND name IN ('bicep', 'cabel');

-- 3. Normalise Unicode typography in descriptions:
--    smart quotes → straight quotes
--    en/em dash → hyphen
--    bullet • → hyphen
--    degree ° → " degrees"
--    DeepL watermark → removed
UPDATE exercises
SET description = trim(regexp_replace(
  translate(
    translate(
      translate(
        translate(
          translate(description,
            E'\u2018\u2019\u02BC', '''' || '''' || ''''),  -- smart single quotes
          E'\u201C\u201D', '""'),                           -- smart double quotes
        E'\u2022', '-'),                                    -- bullet
      E'\u2013', '-'),                                      -- en dash
    E'\u2014', '-'),                                        -- em dash
  'Translated with DeepL\.com[^\n]*', '', 'gi'
))
WHERE is_custom = false
  AND description IS NOT NULL;

-- 4. Null out descriptions that still contain non-ASCII after normalisation
--    (means the description body is in a foreign language)
UPDATE exercises
SET description = NULL
WHERE is_custom = false
  AND description ~ '[^\x00-\x7F]';

-- 5. Null out empty string descriptions
UPDATE exercises
SET description = NULL
WHERE is_custom = false
  AND description = '';
