import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.FORYOU} />;
}

export const metadata = {...pageMetadata('Connect, discover and play', 'Discover conversations, creators, games and community on Kwonnet.', '/', true), title: {absolute: 'Kwonnet — Connect, discover and play'}};
