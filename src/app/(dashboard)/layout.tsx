import React from 'react'
import CustomLayout from './CustomLayout';
import { CustomToolbarActions, NotificationServer } from '@/components/common';

const layout = async(props: any) => {
  return (
    <CustomLayout  
      CustomToolbar={<CustomToolbarActions NotificationNode={<NotificationServer />} />} >
          {props.children}
      </CustomLayout>
  )
}

export default layout
