import React from 'react'
import PageClient from './PageClient'
import { CoinPackage, CryptoAddress } from '@/types'
import { getCurrent_ton_usd_rate } from '@/utils'
import { apiUrl } from '@/config'

type IData = { packages: CoinPackage[], addresses: CryptoAddress[]}
 
const url = apiUrl + "/coins"

const Page = async() => {  

  const result = await fetch(url, { method: 'GET', next: { revalidate: 0} })

  let data: IData  = {addresses: [], packages: []}

  if(result.ok) {
    data = await result.json()
  }

  let currentTonRate: number = 0
  
  const rate = await getCurrent_ton_usd_rate()

  if(rate){
    currentTonRate = rate
  }

  return (<PageClient data={data} currentTonRate={currentTonRate}  />)
}

export default Page