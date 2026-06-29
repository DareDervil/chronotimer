/**
 * Fetch all exercises from wger API and output a SQL seed migration.
 * Run: node scripts/fetch-wger.mjs > supabase/migrations/006_wger_seed.sql
 */

const BASE = 'https://wger.de/api/v2'
const ENGLISH_LANG_ID = 2

const CATEGORY_MAP = {
  Cardio: 'cardio',
  Abs: 'strength',
  Arms: 'strength',
  Back: 'strength',
  Calves: 'strength',
  Chest: 'strength',
  Legs: 'strength',
  Shoulders: 'strength',
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function isAscii(str) {
  return /^[\x00-\x7F]*$/.test(str ?? '')
}

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<li>/gi, '- ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Normalise Unicode typography to plain ASCII equivalents
function normaliseTypography(str) {
  if (!str) return str
  return str
    .replace(/[\u2018\u2019\u02BC]/g, "'")   // smart single quotes / apostrophes
    .replace(/[\u201C\u201D]/g, '"')           // smart double quotes
    .replace(/\u2013/g, '-')                   // en dash
    .replace(/\u2014/g, '--')                  // em dash
    .replace(/\u2022/g, '-')                   // bullet •
    .replace(/\u00B0/g, ' degrees')            // degree symbol °
    .replace(/\u00D7/g, 'x')                   // multiplication sign ×
    .replace(/Translated with DeepL\.com[^\n]*/gi, '') // strip DeepL watermark
    .replace(/\s+/g, ' ')
    .trim()
}

function sql(s) {
  return (s ?? '').replace(/'/g, "''")
}

function sqlArray(items) {
  if (!items || items.length === 0) return "'{}'"
  return `'{${items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join(',')}}'`
}

async function fetchAll(url) {
  const results = []
  let next = url
  let page = 1
  while (next) {
    process.stderr.write(`  page ${page}: ${next}\n`)
    const res = await fetch(next)
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${next}`)
    const data = await res.json()
    results.push(...data.results)
    next = data.next
    page++
    if (next) await sleep(300)
  }
  return results
}

async function main() {
  process.stderr.write('Fetching exercises from wger...\n')
  const exercises = await fetchAll(
    `${BASE}/exerciseinfo/?format=json&limit=100&language=${ENGLISH_LANG_ID}`
  )
  process.stderr.write(`Fetched ${exercises.length} exercise records\n`)

  const rows = []
  const seen = new Set()

  for (const ex of exercises) {
    const enTrans = ex.translations?.find((t) => t.language === ENGLISH_LANG_ID)
    const name = enTrans?.name?.trim()

    // Skip missing, duplicate, or non-English names
    if (!name || seen.has(name.toLowerCase())) continue
    if (!isAscii(name)) continue
    seen.add(name.toLowerCase())

    const rawDescription = normaliseTypography(stripHtml(enTrans.description || ''))
    // Null out descriptions that still contain non-ASCII after normalisation
    // (indicates the wger entry is in a foreign language despite being tagged English)
    const description = rawDescription && isAscii(rawDescription) ? sql(rawDescription) : null
    const category = CATEGORY_MAP[ex.category?.name] ?? 'strength'
    const primaryMuscles = (ex.muscles ?? []).map((m) => m.name).filter(Boolean)
    const secondaryMuscles = (ex.muscles_secondary ?? []).map((m) => m.name).filter(Boolean)
    const equipment = (ex.equipment ?? []).map((e) => e.name).filter(Boolean)

    rows.push(
      `('${sql(name)}', '${category}', ${sqlArray(primaryMuscles)}, ${sqlArray(secondaryMuscles)}, ${sqlArray(equipment)}, ${description ? `'${description}'` : 'NULL'}, NULL, false)`
    )
  }

  process.stderr.write(`Writing ${rows.length} exercises to SQL\n`)

  const lines = [
    '-- ============================================================',
    '-- Chronicon — wger exercise seed (auto-generated)',
    '-- Do not edit manually — re-run scripts/fetch-wger.mjs to regenerate',
    '-- ============================================================',
    '',
    'TRUNCATE exercises CASCADE;',
    '',
    'INSERT INTO exercises (name, category, primary_muscles, secondary_muscles, equipment, description, instructions, is_custom)',
    'VALUES',
    rows.join(',\n') + ';',
  ]

  process.stdout.write(lines.join('\n') + '\n')
}

main().catch((e) => { process.stderr.write(e.stack + '\n'); process.exit(1) })
