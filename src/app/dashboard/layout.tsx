
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import LiveClock from '@/components/live-clock';
import Image from 'next/image';
import type { User } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.role !== 'Propietario' && parsedUser.role !== 'Renta') {
                router.replace('/');
            }
        } else {
            router.replace('/');
        }
    }, [router]);

    const signOut = () => {
        sessionStorage.removeItem('loggedInUser');
        router.push('/');
    };

    if (!user) {
        return <div className="flex h-screen w-full items-center justify-center"><Skeleton className="h-full w-full" /></div>
    }

    return (
        <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 text-card-foreground shadow-sm md:px-6">
            <div className="flex items-center gap-3">
            <Image src="/logoo.png" alt="Logo Glomar" width={40} height={40} />
            <h1 className="text-xl font-bold">Glomar Condominio</h1>
            </div>
            <div className="flex items-center gap-4">
            <LiveClock />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/50">
                            <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                            <AvatarFallback>{user.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background animate-fade-in-up">
            {children}
        </main>
        </div>
    );
}
