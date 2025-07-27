
"use client";

import { useState, useEffect } from "react";
import { getAlertResponses } from "@/lib/alertResponseService";
import type { AlertResponse, User } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import VigilanciaTimeline from "@/components/vigilancia-timeline";

export default function VigilanciaPage() {
    const [responses, setResponses] = useState<AlertResponse[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
            if (storedUser.condominioId) {
                setResponses(getAlertResponses(storedUser.condominioId));
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <Skeleton className="w-full h-96" />;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver al panel">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reporte de Vigilancia</h2>
                    <p className="text-muted-foreground">Historial de respuestas a las alertas de "Prueba de Vida" del personal de seguridad.</p>
                </div>
            </div>
            <Card>
                 <CardHeader>
                    <CardTitle>Línea de Tiempo de Actividad</CardTitle>
                    <CardDescription>Estos son los reportes generados por los guardias durante sus turnos.</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                    <VigilanciaTimeline responses={responses} />
                </CardContent>
            </Card>
        </div>
    );
}
