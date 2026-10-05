import {pageMetadata} from '@/lib/seo';
import PageClient from "./PageClient";

export default function Page() {
  return (
    <div>
        <PageClient />
    </div>
  );
}

export const metadata = pageMetadata('Game winners', 'Game winners on Kwonnet. Connect with your community and manage your experience.', '/games/winners', false);
