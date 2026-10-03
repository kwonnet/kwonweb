// Keep an uncertain charge's identity across button retries, reloads and token refreshes.
// Entries contain only random IDs; the key is a hash of account + canonical request.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export async function prepareWalletIntent(actor: string, route: string, body: unknown, storage: Pick<Storage,'getItem'|'setItem'>) {
  if (!actor) throw new Error('Sign in before making a wallet request');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical({actor,route,body})));
  const slot = `kwonnet:wallet-intent:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}`;
  // No await between read and write: concurrent requests in this tab share the key.
  let key = storage.getItem(slot);
  if (!key) { key = crypto.randomUUID(); storage.setItem(slot,key); }
  return {slot,key};
}
export function completeWalletIntent(slot: string, key: string, storage: Pick<Storage,'getItem'|'removeItem'>) {
  if (storage.getItem(slot) === key) storage.removeItem(slot);
}
export function isWalletCharge(route: string) {
  return /^\/v1\/(wallets\/(transfer|fund)|coins\/purchase|subscriptions\/premium|posts\/[^/]+\/tips)$/.test(route);
}
