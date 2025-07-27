import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import GuardClientLayout from './guard-client-layout';

export default async function GuardiaLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/');
  }

  return <GuardClientLayout user={data.user}>{children}</GuardClientLayout>;
}
