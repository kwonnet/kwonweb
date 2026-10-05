import {pageMetadata} from '@/lib/seo';
import ServerFeed from "@/components/post/ServerFeed";
import { FeedTypeEnum } from "@/types/post";

export default function Page() {
  return <ServerFeed feed={FeedTypeEnum.FORYOU} />;
}

export const metadata = pageMetadata('For you', 'For you on Kwonnet. Connect with your community and manage your experience.', '/foryou', false);
