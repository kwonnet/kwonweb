import React from 'react'
import { Box } from '@mui/material';
import PageServer from './PageServer';
import StickySidebar from '../../../StickySidebar';
import { ConnectionServer } from '@/components/sections';

type URLParams = {
  id: string;
};

type SearchParams = {
  u: string;
}

const Page = async({ params }: { params: Promise<URLParams>; searchParams: Promise<SearchParams> }) => {

  const { id } = await params

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
        <PageServer id={id} />
      </Box>
      <StickySidebar ConnectionSection={<ConnectionServer />} />
    </Box>
  </React.Fragment>
)

}

export default Page


