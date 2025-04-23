'use client'
import { Box, Button, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import React from 'react'

const ErrorMessage = ({message}:{ message: string}) => {
    const router = useRouter()
  return (
    <Box>
    <Typography sx={{display: "flex", height: "100vh", justifyContent: 'center', alignItems: "center"}}>{message}</Typography>
    <Box>
        <Button onClick={() => router.back()}>Go back</Button>
    </Box>
  </Box>
  )
}

export default ErrorMessage