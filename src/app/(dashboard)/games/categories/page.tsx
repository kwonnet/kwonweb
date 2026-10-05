import {pageMetadata} from '@/lib/seo';

import { Game } from "@/types";
import PageClient from "./PageClient";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";

const url = apiUrl + "/games"

export default async function GameCategories() {

  const result = await fetch(url, { method: 'GET', next: { revalidate: 0, tags:['games'] } })

  if(!result.ok) return <ErrorMessage message="Error: Fetching Games" />

  const games:Game[] = await result.json()

  return (
    <div>
      <main>
        <PageClient games={games} />
      </main>
    </div>
  );
}

export const metadata = pageMetadata('Game categories', 'Game categories on Kwonnet. Connect with your community and manage your experience.', '/games/categories', false);
