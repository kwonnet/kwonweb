import type {Metadata} from 'next';
function runtimeEnv(name: string) { return process.env[name]; }
export function siteOrigin() {
  try {const url = new URL(runtimeEnv('NEXT_PUBLIC_APP_URL') || 'https://kwonnet.com'); if (['https:', 'http:'].includes(url.protocol)) return url.origin;} catch {}
  return 'https://kwonnet.com';
}
export function plainDescription(value: string | null | undefined, fallback = 'Connect, discover and share on Kwonnet.') {
  let text = value || '';
  try {const raw = JSON.parse(text); if (Array.isArray(raw.blocks)) text = raw.blocks.map((block: {text?: string}) => typeof block.text === 'string' ? block.text : '').join(' ');} catch {}
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || fallback;
}
export function pageMetadata(title: string, description: string, path?: string, index = false, image?: string): Metadata {
  const url = path ? new URL(path, siteOrigin()).href : undefined;
  let safeImage: string | undefined;
  try {if (image && new URL(image, siteOrigin()).protocol === 'https:') safeImage = new URL(image, siteOrigin()).href;} catch {}
  const images = safeImage ? [{url: safeImage}] : [{url: new URL('/android-chrome-512x512.png', siteOrigin()).href}];
  return {title, description: plainDescription(description), ...(url ? {alternates: {canonical: url}} : {}),
    robots: {index, follow: index, googleBot: {index, follow: index, 'max-image-preview': 'large'}},
    openGraph: {title: `${title} | Kwonnet`, description: plainDescription(description), siteName: 'Kwonnet', type: 'website', ...(url ? {url} : {}), images},
    twitter: {card: 'summary_large_image', title: `${title} | Kwonnet`, description: plainDescription(description), images: images.map(item => item.url)},
  };
}
