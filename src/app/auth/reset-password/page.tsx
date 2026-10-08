import AccountEmailForm from '@/components/auth/AccountEmailForm';
export const metadata = {title: 'Reset password | Kwonnet', robots: {index: false, follow: false}, referrer: 'no-referrer' as const};
export default function Page() {return <AccountEmailForm mode="reset-password"/>;}
