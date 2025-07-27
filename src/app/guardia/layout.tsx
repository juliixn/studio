
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GuardClientLayout from './guard-client-layout';
import type { User } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

function getUserFromSession(): User | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const userJson = window.sessionStorage.getItem('loggedInUser');
    if (!userJson) {
        return null;
    }
    return JSON.parse(userJson);
}


export default function GuardiaLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = getUserFromSession();
        if (storedUser) {
            if (storedUser.role !== 'Guardia') {
                router.replace('/');
            } else {
                setUser(storedUser);
            }
        } else {
            router.replace('/');
        }
        setLoading(false);
    }, [router]);

    if (loading || !user) {
        return <div className="flex h-screen items-center justify-center"><Skeleton className="h-full w-full" /></div>
    }

    return <GuardClientLayout user={user}>{children}</GuardClientLayout>;
}
