import StickySidebar from '@/app/(dashboard)/StickySidebar';
import { Box } from '@mui/material';
import React from 'react'
import PageServer from './PageServer';

type URLParams = {
    kind: string;
    username: string
    id: string
  };
  
  type SearchParams = {
    u: string;
  }
const page = async({ params }: { params: Promise<URLParams>; searchParams: Promise<SearchParams> }) => {
    const _params = await params
    return (<React.Fragment>
        <Box
          sx={{
            flexDirection: "row",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box sx={{ width: { lg: "65%", md: "65%", sm: "100%", xs: "100%"} }}>
            <PageServer args={_params} />
          </Box>
          <StickySidebar />
        </Box>
      </React.Fragment>)
}

export default page