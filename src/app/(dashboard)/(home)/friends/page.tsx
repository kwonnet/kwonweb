import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.FRIENDS} />;
}

export const metadata = pageMetadata('Friends', 'Friends on Kwonnet. Connect with your community and manage your experience.', '/friends', false);
