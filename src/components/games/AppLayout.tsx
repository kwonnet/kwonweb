'use client'
import { AppBottomNav } from '../common'
import { Box } from '@mui/material'
import { usePathname } from 'next/navigation'
import React from 'react'

const AppLayout = (props: any) => {
    const pathname = usePathname()
    const exclude = ["/subscribe"]
    // Check if the current path is a game room page

    const regex = /^\/games\/rooms\/[a-zA-Z0-9]+$/;

    if(regex.test(pathname) || exclude.includes(pathname)){
        return (
            <div>
              <React.Fragment>
                {props.children}
            </React.Fragment>
            </div>
          )
    }
  return (
    <div>
      <React.Fragment>
        {/* <Box sx={{pb: 9}}> */}
        <Box sx={{pb: 8}}>
        {props.children}
        </Box>
        <AppBottomNav />
    </React.Fragment>
    </div>
  )
}

export default AppLayout