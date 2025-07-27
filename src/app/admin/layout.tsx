import {
  Building2,
  LogOut,
  LayoutGrid,
  Settings,
  DollarSign,
  ClipboardList,
  Home,
  Siren,
  EyeOff,
  Eye,
  Phone,
  PowerOff,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LiveClock from '@/components/live-clock';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/');
  }

  const user = data.user;

  const handleLogout = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  };
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <div className="flex flex-col">
           <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
             <div className="flex items-center gap-2 sm:gap-4">
                 <Link href="/admin/dashboard" className="flex items-center gap-2">
                     <Image src="/logoo.png" alt="Logo Glomar" width={32} height={32} />
                     <span className="hidden md:inline-block font-semibold">Glomar Panel</span>
                 </Link>
             </div>

             <div className="ml-auto flex items-center gap-4">
               <LiveClock />
               <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                           <Avatar className="h-10 w-10 border-2 border-primary/50">
                               <AvatarImage src={user.user_metadata.photoUrl} alt={user.user_metadata.name} data-ai-hint="profile picture" />
                               <AvatarFallback>{user.user_metadata.name?.split(' ').map((n:string) => n[0]).join('')}</AvatarFallback>
                           </Avatar>
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-56" align="end" forceMount>
                       <DropdownMenuLabel className="font-normal">
                           <div className="flex flex-col space-y-1">
                               <p className="text-sm font-medium leading-none">{user.user_metadata.name}</p>
                               <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                           </div>
                       </DropdownMenuLabel>
                       <DropdownMenuSeparator />
                       <form action={handleLogout}>
                            <DropdownMenuItem asChild>
                               <button type="submit" className="w-full text-left">
                                   <LogOut className="mr-2 h-4 w-4" />
                                   <span>Cerrar Sesión</span>
                               </button>
                           </DropdownMenuItem>
                       </form>
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
