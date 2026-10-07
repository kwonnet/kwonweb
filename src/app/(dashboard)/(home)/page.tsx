import { pageMetadata, siteOrigin } from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  const origin = siteOrigin();
  const schema = {'@context': 'https://schema.org', '@graph': [
    {'@type': 'Organization', '@id': `${origin}/#organization`, name: 'Kwonnet', url: origin, logo: `${origin}/android-chrome-512x512.png`},
    {'@type': 'WebSite', '@id': `${origin}/#website`, name: 'Kwonnet', url: origin, publisher: {'@id': `${origin}/#organization`}},
  ]};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}} /><ServerFeed feed={FeedTypeEnum.FORYOU} /></>;
}

export const metadata = {
  ...pageMetadata('Connecting the dots and nodes, discover and play', 'Discover fresh conversations, connect with creators, play rewarding games, create and share what matters on Kwonnet.', '/', true), title: { absolute: 'Kwonnet — Connecting the dots and nodes, discover and play', template: '%s — Kwonnet' },
  openGraph: {
    ...pageMetadata('Connecting the dots and nodes, discover and play', 'Discover fresh conversations, connect with creators, play rewarding games, create and share what matters on Kwonnet', '/', true).openGraph,
    title: 'Kwonnet — Connecting the dots and nodes, discover and play',

    url: 'https://kwonnet.com/',
    images: [
      {
        url: 'https://kwonnet.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kwonnet — Connecting the dots and nodes, discover and play',
      },
    ],
  },
  twitter: {
    ...pageMetadata('Connecting the dots and nodes, discover and play', 'Discover fresh conversations, connect with creators, play rewarding games, create and share what matters on Kwonnet', '/', true).twitter, title: 'Kwonnet — Connecting the dots and nodes, discover and play'
  }
};


