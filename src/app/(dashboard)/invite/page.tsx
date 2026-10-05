import {pageMetadata} from '@/lib/seo';
import InviteClient from "./InviteClient";

export default function Page() {
  return (
    <div>
        <InviteClient />
    </div>
  );
}

export const metadata = pageMetadata('Invite friends', 'Invite friends on Kwonnet. Connect with your community and manage your experience.', '/invite', false);
