'use client'
import { Box, Button, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import React from 'react'

const ErrorMessage = ({message}:{ message: string}) => {
    const router = useRouter()
  return (
    <Box sx={{display: "flex", flexDirection: "column", height: "100vh", justifyContent: 'center', alignItems: "center"}}>
    <Typography >{message}</Typography>
    <Box sx={{display: "block", textAlign: "center"}}>
        <Button onClick={() => router.back()}>Go back</Button>
    </Box>
  </Box>
  )
}

export default ErrorMessage