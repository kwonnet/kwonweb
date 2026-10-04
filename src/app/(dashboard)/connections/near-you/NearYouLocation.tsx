'use client'
import { useAuthSession } from '@/hooks'
import { logUserLocation } from '@/lib/users'
import { getUserLocation } from '@/utils/location'
import { useNotifications } from "@/providers/NotificationsProvider"
import React, { useEffect, useState } from 'react'

const NearYouLocation = () => {
    const {token} = useAuthSession()
    const notif = useNotifications()
    useEffect(() => {
    const handleUserLocation = async() => {
        const location = await getUserLocation();
        if (location) {
            await logUserLocation(location.coords, token )
        } else {
            notif.show("Please enable location to see near by users", { autoHideDuration: 3000})
        }
    }
    handleUserLocation()
    // eslint-disable-next-line
    }, [])
    
  return (
    <React.Fragment>

    </React.Fragment>
  )
}

export default NearYouLocation