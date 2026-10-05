import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.FOLLOWING} />;
}

export const metadata = pageMetadata('Following', 'Following on Kwonnet. Connect with your community and manage your experience.', '/following', false);
