"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Condominio } from '@/lib/definitions';
import { getCondominios } from '@/lib/condominioService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function SeleccionarCondominioPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [assignedCondos, setAssignedCondos] = useState<Condominio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            if (parsedUser.role !== 'Adm. Condo' || !parsedUser.condominioIds || parsedUser.condominioIds.length <= 1) {
                // If not Adm. Condo or has 0-1 condos, they shouldn't be here. Redirect them.
                router.replace('/admin/dashboard');
                return;
            }
            setUser(parsedUser);
            const allCondos = getCondominios();
            const userCondos = allCondos.filter(condo => parsedUser.condominioIds?.includes(condo.id));
            setAssignedCondos(userCondos);
        } else {
            router.replace('/'); // No user logged in
        }
        setLoading(false);
    }, [router]);

    const handleSelectCondo = (condoId: string) => {
        const condo = assignedCondos.find(c => c.id === condoId);
        if (condo) {
            sessionStorage.setItem('selectedCondoId', condoId);
            toast({
                title: 'Condominio Seleccionado',
                description: `Ingresando al panel de ${condo.name}.`,
            });
            router.push('/admin/dashboard');
        }
    };
    
    if (loading || !user) {
        return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-2xl shadow-xl animate-fade-in-up">
                <CardHeader className="text-center">
                    <Image src="/logoo.png" alt="Logo Glomar" width={80} height={80} className="mx-auto mb-4" />
                    <CardTitle className="text-2xl">Selecciona un Condominio</CardTitle>
                    <CardDescription>
                        Hola, {user.name}. Elige el condominio que deseas administrar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {assignedCondos.map(condo => (
                        <button
                            key={condo.id}
                            onClick={() => handleSelectCondo(condo.id)}
                            className="w-full text-left p-4 border rounded-md hover:bg-accent hover:border-primary transition-all duration-200 flex justify-between items-center"
                        >
                            <div>
                                <p className="font-semibold">{condo.name}</p>
                                <p className="text-sm text-muted-foreground">{condo.mainAddress}</p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </button>
                    ))}
                    {assignedCondos.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                            No tienes condominios asignados. Contacta a un administrador.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
