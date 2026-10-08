import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import ConnectionServer from '@/components/sections/ConnectionServer';
import StickySidebar from '@/components/common/StickySidebar';

export default function Layout({ children }: { children: ReactNode }) {
  return <Box className="page_wrapper" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
    <Box className="page_content">{children}</Box>
    <StickySidebar ConnectionSection={<ConnectionServer />} />
  </Box>;
}
