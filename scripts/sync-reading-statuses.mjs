import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function resolveReadingStatus({ currentStatus, progressPercent, startedAt, finishedAt, nowIso }) {
  const progress = clamp(Number(progressPercent ?? 0), 0, 100);
  const status = currentStatus ?? 'toread';

  if (progress >= 99.5) {
    return {
      status: 'finished',
      startedAt: startedAt ?? nowIso,
      finishedAt: finishedAt ?? nowIso,
    };
  }

  if (progress > 0 && (status === 'toread' || status === 'paused')) {
    return {
      status: 'reading',
      startedAt: startedAt ?? nowIso,
      finishedAt: null,
    };
  }

  if (status === 'finished' && progress < 99.5) {
    return {
      status: 'reading',
      startedAt: startedAt ?? nowIso,
      finishedAt: null,
    };
  }

  return {
    status,
    startedAt: startedAt ?? null,
    finishedAt: status === 'finished' ? finishedAt ?? nowIso : null,
  };
}

const { data: rows, error } = await supabase
  .from('user_books')
  .select('id,user_id,book_id,status,progress,started_at,finished_at');

if (error) {
  console.error('Failed to load user_books:', error.message);
  process.exit(1);
}

let updated = 0;
for (const row of rows ?? []) {
  const nowIso = new Date().toISOString();
  const resolved = resolveReadingStatus({
    currentStatus: row.status,
    progressPercent: row.progress,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    nowIso,
  });

  const shouldUpdate =
    resolved.status !== row.status ||
    (resolved.startedAt ?? null) !== (row.started_at ?? null) ||
    (resolved.finishedAt ?? null) !== (row.finished_at ?? null);

  if (!shouldUpdate) continue;

  const { error: updateError } = await supabase
    .from('user_books')
    .update({
      status: resolved.status,
      started_at: resolved.startedAt,
      finished_at: resolved.finishedAt,
      updated_at: nowIso,
    })
    .eq('id', row.id);

  if (updateError) {
    console.error(`Failed to update row ${row.id}:`, updateError.message);
    continue;
  }

  updated += 1;
}

console.log(`Reading-status sync complete. Updated rows: ${updated}`);
