'use client'
 
import { incrementViews } from '@/app/server-actions-example/actions'
import { useState, useEffect, useTransition } from 'react'
import { Loader2, Eye } from 'lucide-react';
 
export default function ViewCount({ initialViews }: { initialViews: number }) {
  const [views, setViews] = useState(initialViews)
  const [isPending, startTransition] = useTransition()
 
  useEffect(() => {
    // Al montar el componente, se inicia una transición para
    // llamar a la Server Action que incrementa las visitas.
    startTransition(async () => {
      const updatedViews = await incrementViews();
      setViews(updatedViews);
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
 
  return (
    <div className="flex items-center gap-2 text-lg font-semibold tabular-nums">
        <Eye className="h-5 w-5 text-muted-foreground"/>
        <span>{views}</span>
        {isPending && <Loader2 className="h-5 w-5 text-muted-foreground animate-spin"/>}
    </div>
  )
}
