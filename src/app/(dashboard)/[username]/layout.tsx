import StickySidebar from "@/components/common/StickySidebar";
import { Box } from '@mui/material'
import React from 'react'


const Layout = (props: any) => {
  return (
    <React.Fragment>
        <Box
          sx={{
            flexDirection: "row",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
          className="page_wrapper"
        >
          <Box className="page_content">
            {props.children}
          </Box>
          <StickySidebar />
        </Box>
      </React.Fragment>
  )
}


export default Layout