
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This component now only serves to redirect to the correct plural route.
export default function RedirectToCondominios() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/condominios');
  }, [router]);

  return null; // Render nothing while redirecting
}
