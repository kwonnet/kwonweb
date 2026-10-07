import { pageMetadata } from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.FORYOU} />;
}

export const metadata = {
  ...pageMetadata('Connect the dots and nodes, discover and play', 'Discover conversations, creators, games and community on Kwonnet.', '/', true), title: { absolute: 'Kwonnet — Connecting the dots and nodes, discover and play', template: '%s — Kwonnet' },
  openGraph: {
    ...pageMetadata('Connect the dots and nodes, discover and play', 'Discover conversations, creators, games and community on Kwonnet.', '/', true).openGraph,
    title: 'Kwonnet — Connecting the dots and nodes, discover and play',
    url: 'https://kwonnet.com/',
    images: [
      {
        url: 'https://kwonnet.com/kwonnet-og-image.png',
        width: 1024,
        height: 1024,
        alt: 'Kwonnet — Connecting the dots and nodes, discover and play',
      },
    ],
  },
  twitter: {
    ...pageMetadata('Connect the dots and nodes, discover and play', 'Discover conversations, creators, games and community on Kwonnet.', '/', true).twitter, title: 'Kwonnet — Connecting the dots and nodes, discover and play'
  }
};


