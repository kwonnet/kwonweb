import React from 'react'
import CustomLayout from './CustomLayout';
import { CustomToolbarActions, NotificationServer } from '@/components/common';
import { Metadata } from 'next';
import { constant } from '@/config';

export const metadata: Metadata = {
  title: constant.siteName,
  description: constant.siteDescription,
};

const layout = async(props: any) => {
  return (
    <CustomLayout  
      CustomToolbar={<CustomToolbarActions NotificationNode={<NotificationServer />} />} >
          {props.children}
      </CustomLayout>
  )
}

export default layout
