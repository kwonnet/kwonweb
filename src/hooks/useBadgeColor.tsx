'use client'
import { useTheme } from '@mui/material'
import React from 'react'

const useBadgeColor = (color?: string) => {
    const theme = useTheme()
    return color === "gold" ? 'gold' : color === "grey" ? theme.vars.palette.grey[500] : theme.vars.palette.info.light
}

export default useBadgeColor