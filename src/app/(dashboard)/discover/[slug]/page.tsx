import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/server-session';
import { getTrendingTopics } from '@/lib/discover';
import { discoverTabItems } from '@/data';
import PageClient from '../PageClient';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === 'foryou') redirect('/discover');
  if (!discoverTabItems.some(item => item.id === slug) || ['discover', 'worldwide', 'trending'].includes(slug)) notFound();
  const topic = slug === 'arts-culture' ? 'arts & culture' : slug;
  const session = await getServerSession();
  const trends = await getTrendingTopics({ topic, limit: 50 }, session?.user?.accessToken).catch(() => []);
  return <PageClient key={topic} topic={topic} trends={trends} />;
}
