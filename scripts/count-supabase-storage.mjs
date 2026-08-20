#!/usr/bin/env node
// Read-only: walks the public storage buckets and reports object count + total bytes,
// so we can size the Supabase Storage -> R2 migration. Writes nothing.
//
//   node --env-file=.env.local scripts/count-supabase-storage.mjs
//
// Uses the anon key: both buckets have a public `select` policy on storage.objects
// (supabase/migrations/20260322153001_storage_buckets_and_policies.sql), so listing works.
// Set SUPABASE_SERVICE_ROLE_KEY instead if the policies ever get locked down.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).");
  process.exit(1);
}

const PAGE = 100;

async function list(bucket, prefix) {
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${url}/storage/v1/object/list/${bucket}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix, limit: PAGE, offset, sortBy: { column: "name", order: "asc" } }),
    });
    if (!res.ok) throw new Error(`${bucket}/${prefix}: ${res.status} ${await res.text()}`);
    const page = await res.json();
    out.push(...page);
    if (page.length < PAGE) return out;
  }
}

// A Supabase list entry with no `id` is a synthetic folder, not an object.
async function walk(bucket, prefix = "", depth = 0) {
  let files = 0, bytes = 0;
  for (const entry of await list(bucket, prefix)) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) {
      files += 1;
      bytes += entry.metadata?.size ?? 0;
    } else if (depth < 4) {
      const sub = await walk(bucket, path, depth + 1);
      files += sub.files;
      bytes += sub.bytes;
    }
  }
  return { files, bytes };
}

const mb = (b) => (b / 1024 / 1024).toFixed(2);
let grand = { files: 0, bytes: 0 };

for (const bucket of ["listing-images", "profile-images"]) {
  const { files, bytes } = await walk(bucket);
  grand.files += files;
  grand.bytes += bytes;
  console.log(`${bucket.padEnd(16)} ${String(files).padStart(6)} objects  ${mb(bytes).padStart(10)} MB`);
}
console.log(`${"TOTAL".padEnd(16)} ${String(grand.files).padStart(6)} objects  ${mb(grand.bytes).padStart(10)} MB`);
console.log(`avg object size: ${grand.files ? mb(grand.bytes / grand.files) : 0} MB`);
