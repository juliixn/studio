
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GuardClientLayout from './guard-client-layout';
import type { User } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export default function GuardiaLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'Guardia') {
                router.replace('/');
            } else {
                setUser(parsedUser);
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
