import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.TRENDING} />;
}

export const metadata = pageMetadata('Trending', 'Trending on Kwonnet. Connect with your community and manage your experience.', '/trending', false);
