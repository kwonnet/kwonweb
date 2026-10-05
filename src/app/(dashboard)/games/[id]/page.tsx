import {gameMetadata} from '@/lib/seo-data';
import { Game, GameCategory } from "@/types";
import { redirect } from "next/navigation";
import React from "react";
import PageClient from "./PageClient";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";

type URLParams = {
  id: string;
};

type SearchParams = {
  g_n: string;
}



const url = apiUrl + "/games/categories/";

const Page = async ({ params, searchParams }: { params: Promise<URLParams>; searchParams: Promise<SearchParams> }) => {

  const _searchParams = await searchParams

  const _params = await params

  if (!_params.id || !_searchParams.g_n) return redirect("/games");
  
  const result = await fetch(url + _params.id, {
    method: "GET",
    next: { revalidate: 0, tags: ['game-categories'] },
    credentials: "include",
    mode: "cors",
  });

  if (!result.ok) return <ErrorMessage message="Error: Fetching Game Categories" />;

  const response: { game: Game, categories: GameCategory[]} = await result.json();

  // const game={id: _params.id, name: _searchParams.g_n}

  return <PageClient categories={response.categories}  game={response.game}  />
};

export default Page;
export async function generateMetadata({params}: {params: Promise<{id: string}>}) {
  return gameMetadata((await params).id);
}
