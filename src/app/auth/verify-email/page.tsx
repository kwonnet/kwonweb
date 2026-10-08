import AccountEmailForm from '@/components/auth/AccountEmailForm';
export const metadata = {title: 'Verify email | Kwonnet', robots: {index: false, follow: false}, referrer: 'no-referrer' as const};
export default function Page() {return <AccountEmailForm mode="verify-email"/>;}
