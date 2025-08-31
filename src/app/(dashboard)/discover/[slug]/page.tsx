import { redirect } from 'next/navigation'
import React from 'react'

const Page = async({params}:{ params: Promise<{slug: string}> }) => {
    const args = await params
    if(args.slug === "foryou") return redirect("/discover")
  return (
    <div>Page - {args.slug}</div>
  )
}

export default Page