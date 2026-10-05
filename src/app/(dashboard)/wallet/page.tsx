import {pageMetadata} from '@/lib/seo';
import React from 'react'
import WalletClient from './WalletClient'
import { getCurrent_ton_usd_rate } from '@/utils'


const Page = async() => {

  let tonRate: number = 0
    
  const rate = await getCurrent_ton_usd_rate()

  if(rate){
    tonRate = rate
  }

  return (<WalletClient tonRate={tonRate}  />)
}



export default Page
export const metadata = pageMetadata('Wallet', 'Wallet on Kwonnet. Connect with your community and manage your experience.', '/wallet', false);
