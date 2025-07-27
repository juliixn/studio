
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function SuspendidoPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 text-center">
            <div className="max-w-md w-full">
                <Image
                    src="/logoo.png"
                    alt="Servicio suspendido"
                    width={400}
                    height={400}
                    className="mx-auto"
                    data-ai-hint="confused guard condominium"
                />
                <h1 className="mt-4 text-2xl font-bold text-foreground">
                    Parece ser que tenemos un problema
                </h1>
                <p className="mt-2 text-muted-foreground">
                    El servicio para tu condominio no está disponible en este momento. Contacta a la administración para más información.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Redirigiendo al inicio de sesión...</span>
                </div>
            </div>
        </div>
    );
}
