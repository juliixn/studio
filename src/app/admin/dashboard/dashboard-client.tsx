
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, FileText, HelpCircle, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import type { ActivityFeedItem } from '@/components/admin/activity-feed';
import type { VehicularRegistration, PedestrianRegistration } from "@/lib/definitions";
import { getVehicularRegistrations, getPedestrianRegistrations } from '@/lib/registrationService';
import { getPackages } from '@/lib/packageService';
import { getPeticiones } from '@/lib/peticionService';
import { getBitacora } from '@/lib/bitacoraService';

// Dynamic imports for components that need to run only on the client
const AccesosChart = dynamic(() => import('@/components/admin/accesos-chart'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});
const TopDomiciliosCard = dynamic(() => import('@/components/admin/top-domicilios-card'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});
const ActivityFeed = dynamic(() => import('@/components/admin/activity-feed'), {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" /> 
});

interface DashboardData {
    vehicular: VehicularRegistration[];
    pedestrian: PedestrianRegistration[];
    packages: { status: string }[];
    peticiones: { status: string }[];
    bitacora: { id: string, authorName: string, text: string, createdAt: string }[];
}

interface AdminDashboardClientProps {
    initialData: DashboardData; // Will be empty initially
}

export default function AdminDashboardClient({ initialData }: AdminDashboardClientProps) {
    const [data, setData] = useState<DashboardData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [vehicularData, pedestrianData, packagesData, peticionesData, bitacoraData] = await Promise.all([
                getVehicularRegistrations(),
                getPedestrianRegistrations(),
                getPackages(),
                getPeticiones(),
                getBitacora()
            ]);
            setData({
                vehicular: vehicularData,
                pedestrian: pedestrianData,
                packages: packagesData,
                peticiones: peticionesData,
                bitacora: bitacoraData
            });
            setIsLoading(false);
        }
        fetchData();
    }, []);
    
    const { vehicular, pedestrian, packages, peticiones, bitacora } = data;

    const activeVehicles = vehicular?.filter(v => !v.exitTimestamp) || [];
    const pendingPackages = packages?.filter(p => p.status !== 'Entregado') || [];
    const openPeticiones = peticiones?.filter(p => p.status === 'Abierta') || [];

    const activityFeedItems: ActivityFeedItem[] = [
      ...(vehicular || []).map(v => ({ id: v.id, type: 'vehicular' as const, date: v.entryTimestamp, text: `Entrada Vehicular: ${v.fullName}`, subtext: `Placa: ${v.licensePlate}` })),
      ...(pedestrian || []).map(p => ({ id: p.id, type: 'pedestrian' as const, date: p.entryTimestamp, text: `Entrada Peatonal: ${p.fullName}`, subtext: `Domicilio: ${p.address}` })),
      ...(bitacora || []).map(b => ({ id: b.id, type: 'bitacora' as const, date: b.createdAt, text: `Novedad: ${b.authorName}`, subtext: b.text.substring(0, 50) + '...' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    if (isLoading) {
        return <Skeleton className="h-screen w-full" />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Dashboard de Operaciones</h2>
                <p className="text-muted-foreground">Resumen del estado actual del sistema.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vehículos Activos</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeVehicles.length}</div>
                        <p className="text-xs text-muted-foreground">Vehículos actualmente dentro</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paquetes Pendientes</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPackages.length}</div>
                        <p className="text-xs text-muted-foreground">Paquetes esperando a ser recogidos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Peticiones Abiertas</CardTitle>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openPeticiones.length}</div>
                        <p className="text-xs text-muted-foreground">Solicitudes esperando atención</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Novedades (Bitácora)</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bitacora?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">Total de registros en bitácora</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <AccesosChart vehicular={vehicular || []} pedestrian={pedestrian || []} />
                </div>
                <div className="lg:col-span-3">
                    <TopDomiciliosCard vehicular={vehicular || []} pedestrian={pedestrian || []} />
                </div>
            </div>
            <div className="grid gap-4">
                <ActivityFeed items={activityFeedItems} />
            </div>
        </div>
    );
}
