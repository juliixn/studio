
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CondominioEditor from '@/components/admin/condominio-editor';
import { getCondominioById, updateCondominio } from '@/lib/condominioService';
import { useToast } from '@/hooks/use-toast';
import type { Condominio } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditarCondominioPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const id = params.id as string;

    const [initialData, setInitialData] = useState<Condominio | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            const fetchCondo = async () => {
                const condo = await getCondominioById(id);
                if (condo) {
                    setInitialData(condo);
                } else {
                    toast({
                        title: "Error",
                        description: "No se encontró el condominio para editar.",
                        variant: "destructive"
                    });
                    router.replace('/admin/condominios');
                }
                setLoading(false);
            }
            fetchCondo();
        }
    }, [id, router, toast]);

    const handleSubmit = async (data: Partial<Omit<Condominio, 'id'>>) => {
        await updateCondominio(id, data);
        toast({
            title: "Condominio Actualizado",
            description: `El condominio "${data.name}" ha sido actualizado exitosamente.`,
        });
        router.push('/admin/condominios');
    };

    if (loading) {
        return <Skeleton className="h-[500px] w-full" />;
    }

    if (!initialData) {
        return null;
    }

    return (
        <CondominioEditor 
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/admin/condominios')}
        />
    );
}
