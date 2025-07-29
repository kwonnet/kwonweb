import React from 'react'
import PageClient from './PageClient'
import CoinsServer from './CoinsServer'


type SearchParams = {
  r_n: string;
  r_c: string;
  r_m: string;
}

type URLParams = {
  id: string
}

const Page = async({ params, searchParams }: { params: Promise<URLParams>, searchParams: Promise<SearchParams>}) => {

  const _params = await params

  const _searchParams =  await searchParams

  const room = { id: _params.id, name: _searchParams.r_n, catId: _searchParams.r_c, mode: _searchParams.r_m }

  return (<PageClient room={room} buyCoinsComponent={<CoinsServer />} />)
}

export default Page