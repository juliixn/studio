
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  Users2,
  LineChart,
  Package,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  Building,
  ClipboardList,
  DollarSign,
  ShieldCheck,
  Package2,
  Users,
  CircleUser
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LiveClock from '@/components/live-clock';
import Image from 'next/image';
import type { User } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';

const navItems = [
    { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
    { href: "/admin/gestion", icon: Building, label: "Gestión" },
    { href: "/admin/operaciones", icon: ShieldCheck, label: "Operaciones" },
    { href: "/admin/finanzas", icon: DollarSign, label: "Finanzas" },
    { href: "/admin/configuracion", icon: Settings, label: "Configuración" },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role !== 'Administrador' && parsedUser.role !== 'Adm. Condo') {
            router.replace('/');
        }
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('selectedCondoId');
    router.push('/');
  };
  
  if (!user) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Skeleton className="h-full w-full" />
          </div>
      );
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
          <SidebarContent>
              <SidebarHeader>
                 <div className="flex items-center gap-2" data-testid="sidebar-header-content">
                    <Package2 className="h-6 w-6" />
                    <span className="font-semibold">Glomar Panel</span>
                </div>
              </SidebarHeader>
              <SidebarMenu>
                {navItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                        <Link href={item.href} passHref legacyBehavior>
                           <SidebarMenuButton isActive={pathname.startsWith(item.href)}>
                                <item.icon className="h-4 w-4" />
                                {item.label}
                           </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
          </SidebarContent>
      </Sidebar>

      <div className="flex flex-col flex-1">
           <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <SidebarTrigger className="sm:hidden"/>
             <div className="ml-auto flex items-center gap-4">
               <LiveClock />
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                           <Avatar className="h-10 w-10 border-2 border-primary/50">
                               <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                               <AvatarFallback>{user.name?.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
                           </Avatar>
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-56" align="end" forceMount>
                       <DropdownMenuLabel className="font-normal">
                           <div className="flex flex-col space-y-1">
                               <p className="text-sm font-medium leading-none">{user.name}</p>
                               <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                           </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                           <LogOut className="mr-2 h-4 w-4" />
                           <span>Cerrar Sesión</span>
                       </DropdownMenuItem>
                   </DropdownMenuContent>
               </DropdownMenu>
             </div>
           </header>
          <main className="flex-1 p-4 sm:p-6 bg-muted/40 overflow-y-auto animate-fade-in-up pb-24">
            {children}
          </main>
      </div>
    </div>
  );
}
