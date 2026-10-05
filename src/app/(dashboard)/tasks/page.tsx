import {pageMetadata} from '@/lib/seo';
import PageClient from './PageClient';
export const metadata=pageMetadata('Engagement tasks','Complete verified engagement tasks and earn Kwonnet bonus coins.','/tasks',false);
export default function Page() {return <PageClient />;}
