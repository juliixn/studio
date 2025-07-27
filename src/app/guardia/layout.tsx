import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import GuardClientLayout from './guard-client-layout';
import type { User } from '@/lib/definitions';

export default async function GuardiaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // This case might happen if profile creation failed.
    // Log out the user to let them try again.
    await supabase.auth.signOut();
    return redirect('/');
  }

  return <GuardClientLayout user={profile as User}>{children}</GuardClientLayout>;
}
