/** Run with Node 22+ and --experimental-strip-types. Dry-run unless --apply. */
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { STREAM_ALLOWED_ORIGINS } from '../src/lib/storage/stream.ts';

export async function updateStreamOrigins({accountId, token, apply = false, fetcher = fetch, backup = writeFile}) {
  if (!/^[a-f0-9]{32}$/i.test(accountId || '') || !token) throw new Error('Configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_ACCOUNT_API_TOKEN with Stream edit permissions.');
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
  async function request(url, options = {}) {
    const response = await fetcher(url, {...options, headers: {Authorization: `Bearer ${token}`, 'Content-Type':'application/json'}, signal: AbortSignal.timeout(20000), redirect:'error'});
    const body = await response.json().catch(() => undefined);
    if (!response.ok || !body?.success) throw new Error(`Cloudflare Stream request failed (HTTP ${response.status}).`);
    return body.result;
  }
  const videos = new Map();
  let before;
  for (;;) {
    const query = new URLSearchParams({limit:'1000',asc:'false'});
    if (before) query.set('before', before);
    const batch = await request(`${base}?${query}`);
    if (!Array.isArray(batch)) throw new Error('Cloudflare returned an invalid video list.');
    for (const video of batch) {
      if (!/^[a-f0-9]{32}$/i.test(video.uid || '')) throw new Error('Cloudflare returned an invalid video ID.');
      videos.set(video.uid,video);
    }
    if (batch.length < 1000) break;
    const oldest = batch.reduce((date,video)=>video.created < date ? video.created : date,batch[0].created);
    if (!oldest || !Number.isFinite(Date.parse(oldest)) || (before && oldest >= before)) throw new Error('Unable to advance through the video list; no settings were changed.');
    // A date-only cursor cannot safely page through a full timestamp boundary.
    if (batch.filter(video=>video.created===oldest).length > 1) throw new Error('Video creation timestamps overlap at the pagination boundary; no settings were changed.');
    before = oldest;
  }
  const changes = [...videos.values()].filter(video=>!STREAM_ALLOWED_ORIGINS.every(origin=>video.allowedOrigins?.includes(origin)) || video.allowedOrigins.length !== STREAM_ALLOWED_ORIGINS.length);
  if (!apply || !changes.length) return {total:videos.size,needsUpdate:changes.length,updated:0,allowedOrigins:STREAM_ALLOWED_ORIGINS};
  const backupPath = `stream-origins-backup-${Date.now()}.json`;
  await backup(backupPath,JSON.stringify(changes.map(video=>({uid:video.uid,allowedOrigins:video.allowedOrigins ?? []})),null,2)+'\n',{flag:'wx',mode:0o600});
  let updated=0;
  for (const video of changes) {
    const result = await request(`${base}/${video.uid}`,{method:'POST',body:JSON.stringify({uid:video.uid,allowedOrigins:STREAM_ALLOWED_ORIGINS})});
    if (!Array.isArray(result?.allowedOrigins) || !STREAM_ALLOWED_ORIGINS.every(origin=>result.allowedOrigins.includes(origin))) throw new Error(`Playback permissions could not be verified. ${updated} videos updated; previous settings are in ${backupPath}.`);
    updated++;
  }
  return {total:videos.size,needsUpdate:changes.length,updated,backupPath,allowedOrigins:STREAM_ALLOWED_ORIGINS};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await updateStreamOrigins({accountId:process.env.CLOUDFLARE_ACCOUNT_ID,token:process.env.CLOUDFLARE_ACCOUNT_API_TOKEN,apply:process.argv.includes('--apply')});
    console.log(JSON.stringify(result,null,2));
  } catch (error) {
    console.error(error.message);process.exitCode=1;
  }
}
