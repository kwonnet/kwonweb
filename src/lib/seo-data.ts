import {getPublicGameMetadata} from '@/lib/games';
import 'server-only';
import {cache} from 'react';
import {getPublicProfileMetadata} from '@/lib/users';
import {getPublicPostMetadata, getPublicPostMetadataIndex} from '@/lib/posts';
import {pageMetadata, plainDescription} from './seo';
export const profileMetadata = cache(async (username: string, suffix = '', label = 'Profile') => {
  const profile = await getPublicProfileMetadata(username);
  const path = `/@${encodeURIComponent(profile?.username || username.replace(/^@/, ''))}${suffix}`;
  return pageMetadata(profile ? `${profile.name} (@${profile.username})${suffix ? ` · ${label}` : ''}` : label, profile?.bio || 'View this profile on Kwonnet.', path, false, profile?.avatar ?? undefined);
});
export const postMetadata = cache(async (username: string, id: string, _embed = false) => {
  const post = await getPublicPostMetadata(id);
  const handle = post?.user?.username || username.replace(/^@/, '');
  const path = `/@${encodeURIComponent(handle)}/feed/${encodeURIComponent(id)}`;
  return pageMetadata(post ? `${post.user.name} on Kwonnet` : 'Post', plainDescription(post?.content, 'View this post on Kwonnet.'), path, !!post && !_embed, post?.media?.[0]?.thumbnailUrl || (post?.media?.[0]?.fileType?.startsWith('image/') ? post.media[0].url : undefined));
});
export const publicPostIndex = getPublicPostMetadataIndex;

export const gameMetadata = cache(async (id: string) => {
  const result = await getPublicGameMetadata(id);
  const name = result?.name || 'Game categories';
  return pageMetadata(name, `Explore ${name} categories and games on Kwonnet.`, `/games/${encodeURIComponent(id)}`, false);
});
