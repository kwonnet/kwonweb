import React from 'react'

const Page = async({params, searchParams}: { params: Promise<Object>, searchParams: Promise<{tag: string}> }) => {

    const _searchParams = await searchParams
  return (
    <div>Page - {_searchParams.tag} </div>
  )
}

export default Page