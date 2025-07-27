
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User, TurnoInfo, PanicAlert } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon } from 'lucide-react';
import LiveClock from '@/components/live-clock';
import Image from 'next/image';
import { endShift } from '@/lib/shiftService';

export default function GuardClientLayout({ user: initialUser, children }: { user: User, children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(initialUser);
    const [turnoInfo, setTurnoInfo] = useState<TurnoInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sessionStorage.setItem('loggedInUser', JSON.stringify(initialUser));
        setUser(initialUser);
    }, [initialUser]);


    useEffect(() => {
        const storedTurno = sessionStorage.getItem('turnoInfo');
        if (pathname === '/guardia/iniciar-turno') {
            setLoading(false);
            return;
        }

        if (user && storedTurno) {
            setTurnoInfo(JSON.parse(storedTurno));
        } else {
            router.replace('/guardia/iniciar-turno');
        }
        setLoading(false);
    }, [pathname, user, router]);


    const handleLogout = async () => {
        const currentShiftId = sessionStorage.getItem('currentShiftId');
        if (currentShiftId) {
            await endShift(currentShiftId);
        }
        sessionStorage.removeItem('turnoInfo');
        sessionStorage.removeItem('currentShiftId');
        sessionStorage.removeItem('loggedInUser');
        router.push('/');
    };

    if (loading || (!user && pathname !== '/guardia/iniciar-turno') || (!turnoInfo && pathname !== '/guardia/iniciar-turno')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Image src="/logoo.png" alt="Logo Glomar" width={100} height={100} className="animate-pulse" />
            </div>
        );
    }
    
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 text-card-foreground shadow-sm md:px-6">
        <div className="flex items-center gap-3">
          <Image src="/logoo.png" alt="Logo Glomar" width={40} height={40} />
          <h1 className="text-xl font-bold">Glomar Condominios</h1>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" disabled={!user}>
                      {user && <Avatar className="h-10 w-10 border-2 border-primary/50">
                          <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                          <AvatarFallback>{user.name?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>}
                  </Button>
              </DropdownMenuTrigger>
              {user && <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                  </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Terminar Turno y Salir</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>}
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center bg-background animate-fade-in-up">
          {children}
      </main>
    </div>
  );
}
