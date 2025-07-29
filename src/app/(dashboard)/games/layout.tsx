import React from 'react'
import { Metadata } from 'next';
import { constant } from '@/config';

export const metadata: Metadata = {
  title: constant.siteName,
  description: constant.siteDescription,
};

const layout = async(props: any) => {
  return (
    <React.Fragment>  
          {props.children}
      </React.Fragment>
  )
}

export default layout
