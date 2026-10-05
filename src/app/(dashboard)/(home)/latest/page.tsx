import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.LATEST} />;
}

export const metadata = pageMetadata('Latest posts', 'Latest posts on Kwonnet. Connect with your community and manage your experience.', '/latest', false);
