import React from 'react'
import { Metadata } from 'next';
import { constant } from '@/config';
import GameSocketIoProvider from '@/context/GameSocketIoContext';

export const metadata: Metadata = {
  title: constant.siteName,
  description: constant.siteDescription,
};

const Layout = async(props: any) => {
  return (
    <React.Fragment>  
      <GameSocketIoProvider>
          {props.children}
      </GameSocketIoProvider>
      </React.Fragment>
  )
}

export default Layout
