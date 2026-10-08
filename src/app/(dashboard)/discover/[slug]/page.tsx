import {pageMetadata} from '@/lib/seo';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-session';
import { getTrendingTopics } from '@/lib/discover';
import { discoverTabItems } from '@/data';
import DisplayError from '@/components/common/DisplayError';
import PageClient from '../PageClient';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'foryou') redirect('/discover');
  if (!discoverTabItems.some(item => item.id === slug) || ['discover', 'worldwide', 'trending'].includes(slug)) notFound();
  const topic = slug === 'arts-culture' ? 'arts & culture' : slug;
  const session = await getServerSession();
  const trends = await getTrendingTopics({ topic, limit: 50 }, session?.user?.accessToken).catch(() => undefined);
  if (!trends) return <DisplayError status={503} message="Unable to load trends. Please try again." />;
  return <PageClient key={topic} topic={topic} trends={trends} />;
}

export async function generateMetadata({params}: {params: Promise<{slug: string}>}) {
  const p = await params;
  const topic = discoverTabItems.find(item => item.id === p.slug)?.name || 'Discover';
  return pageMetadata(`${topic} trends`, `Explore ${topic.toLowerCase()} trends and conversations on Kwonnet.`, "/" + 'discover' + "/" + encodeURIComponent(p.slug), false);
}
