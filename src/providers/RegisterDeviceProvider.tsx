'use client';
import type { ReactNode } from 'react';
// Devices are enrolled only after the user unlocks the account-scoped E2EE vault.
// Publishing keys before durable local key storage makes offline delivery unrecoverable.
export default function RegisterDeviceProvider({ children }: {
    children: ReactNode;
}) { return children; }
