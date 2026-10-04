import { GameRoom } from "@/types";
import { redirect } from "next/navigation";
import React from "react";
import PageClient from "./PageClient";
import ErrorMessage from "@/components/common/ErrorMessage";
import { apiUrl } from "@/config";

type URLParams = {
  id: string;
};
type SearchParams = {
    c_i: string;
    c_n: string;
    c_m: string;
  }
const url = apiUrl + "/games/categories/";

const Page = async ({ searchParams }: { params: Promise<URLParams>, searchParams: Promise<SearchParams>}) => {

  const _searchParams = await searchParams

  if (!_searchParams.c_i || !_searchParams.c_n) return redirect("/");

  const id = _searchParams.c_i

  const name = _searchParams.c_n

  const mode = _searchParams.c_m

  const result = await fetch(url + id + `/rooms?mode=${mode}`, {
    method: "GET",
    next: { revalidate: 0, tags: [`${id}_game_rooms`] },
    credentials: "include",
    mode: "cors"
  });

  if (!result.ok) return <ErrorMessage message="Error: Fetching Game Category Rooms" />

  const rooms: GameRoom[] = await result.json();

  const cat = { id, name, mode }

  return <PageClient rooms={rooms} cat={cat} />
};

export default Page;
