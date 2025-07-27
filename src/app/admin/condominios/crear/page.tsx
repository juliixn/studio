
"use client";

import { useRouter } from 'next/navigation';
import CondominioEditor from '@/components/admin/condominio-editor';
import { addCondominio } from '@/lib/condominioService';
import { useToast } from '@/hooks/use-toast';
import type { Condominio } from '@/lib/definitions';
import { useTransition } from 'react';

export default function CrearCondominioPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (data: Omit<Condominio, 'id' | 'status'>) => {
        startTransition(async () => {
            await addCondominio(data);
            toast({
                title: "Condominio Creado",
                description: `El condominio "${data.name}" ha sido creado exitosamente.`,
            });
            router.push('/admin/condominios');
        });
    };

    return (
        <CondominioEditor 
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/condominios')}
            isPending={isPending}
        />
    );
}
