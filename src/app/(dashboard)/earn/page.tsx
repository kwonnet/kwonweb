import {pageMetadata} from '@/lib/seo';
import PageClient from "./PageClient";

export default function Page() {
  return (
    <div>
        <PageClient />
    </div>
  );
}

export const metadata = pageMetadata('Earn', 'Earn on Kwonnet. Connect with your community and manage your experience.', '/earn', false);
