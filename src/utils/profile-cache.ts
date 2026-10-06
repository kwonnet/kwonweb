import type { EditableProfile } from '@/types/profile';
type ProfileIdentity = Pick<EditableProfile, 'id' | 'name' | 'username'> & Partial<EditableProfile> & {country?: unknown};

/** Replace public identity fields in cached cards/profile records, preserving actions and private fields. */
export function updateProfileCache(value: unknown, profile: ProfileIdentity): unknown {
  if (Array.isArray(value)) {
    const next = value.map(item => updateProfileCache(item, profile));
    return next.some((item, index) => item !== value[index]) ? next : value;
  }
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  const record = value as Record<string, unknown>;
  let next = record;
  for (const [key, item] of Object.entries(record)) {
    const updated = updateProfileCache(item, profile);
    if (updated !== item) { if (next === record) next = { ...record }; next[key] = updated; }
  }
  if (record.id === profile.id && typeof record.username === 'string') {
    next = { ...next, name: profile.name, username: profile.username, avatar: profile.avatar,
      ...('image' in record ? { image: profile.avatar } : {}),
      ...('banner' in record && profile.banner !== undefined ? { banner: profile.banner } : {}),
      ...('bio' in record && profile.bio !== undefined ? { bio: profile.bio } : {}),
      ...('website' in record && profile.website !== undefined ? {website: profile.website} : {}),
      ...('country' in record && 'country' in profile ? {country: profile.country} : {}),
      ...('countryId' in record && 'countryId' in profile ? {countryId: profile.countryId} : {}),
    };
  }
  return next;
}
