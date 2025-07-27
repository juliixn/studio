"use client";

import { useState, useEffect } from "react";
import { getBitacora } from "@/lib/bitacoraService";
import type { BitacoraEntry, User } from "@/lib/definitions";
import { Card, CardContent } from "@/components/ui/card";
import BitacoraTimeline from "@/components/bitacora-timeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function BitacoraPage() {
    const [entries, setEntries] = useState<BitacoraEntry[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        const fetchData = async () => {
            if (storedUserStr) {
                const storedUser = JSON.parse(storedUserStr);
                setUser(storedUser);
                if (storedUser.condominioId) {
                    const data = await getBitacora(storedUser.condominioId);
                    setEntries(data);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);
    
    // Optional: Refresh data periodically
     useEffect(() => {
        const interval = setInterval(async () => {
            if (user?.condominioId) {
                 const data = await getBitacora(user.condominioId);
                 setEntries(data);
            }
        }, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Card><CardContent className="pt-6"><Skeleton className="w-full h-96" /></CardContent></Card>
            </div>
        );
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
                    <h2 className="text-2xl font-bold tracking-tight">Bitácora de Novedades</h2>
                    <p className="text-muted-foreground">Historial completo de novedades para tu condominio.</p>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                         <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
                    ) : (
                        <BitacoraTimeline entries={entries} currentUser={user} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
