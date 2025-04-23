import { Badge, Box, IconButton, Stack, Tooltip } from '@mui/material'
import { Account } from '@toolpad/core'
import React from 'react'
import SearchToolbar from './SearchToolbar'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Link from 'next/link';

const CustomToolbarActions = (props: { NotificationNode?: React.ReactNode}) => {
  const msgStats = { totalUnreadCount: 20, totalUnseenCount: 30}
  return (
    <React.Fragment>
        <Stack suppressHydrationWarning direction="row" alignItems={"center"} spacing={2}>
            <SearchToolbar />
            <Box>
            <Tooltip title="Messages" suppressHydrationWarning>
              <IconButton
                size="medium"
                LinkComponent={Link}
                href='/messages'
              >
                <Badge
                  color="error"
                  badgeContent={msgStats.totalUnseenCount}
                  max={99}
                >
                  <EmailOutlinedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            </Box>
            {props.NotificationNode}
            <Account />
        </Stack>
    </React.Fragment>
  )
}


export default CustomToolbarActions