'use client'
import { Box, Container } from '@mui/material'
import React from 'react'

const AppWrapper = (props: any) => {
  return (
    <Box sx={[theme => ({
        minHeight: "100vh", 
        // background: theme => theme.vars.palette.gradient[300],
        // color: theme.vars.palette.common.white,
        // ...theme.applyStyles("dark", {
        //     background: theme.vars.palette.shades.A900,
        // })
        })]}>
        {props.children}
    </Box>
  )
}

export default AppWrapper