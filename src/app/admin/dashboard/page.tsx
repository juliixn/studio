import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, FileText, HelpCircle, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import type { ActivityFeedItem } from '@/components/admin/activity-feed';
import { Suspense } from "react";

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

async function AdminDashboardContent() {
    const supabase = createClient();

    const { data: vehicular, error: vError } = await supabase.from('vehicular_registrations').select('*');
    const { data: pedestrian, error: pError } = await supabase.from('pedestrian_registrations').select('*');
    const { data: packages, error: pkgError } = await supabase.from('packages').select('*');
    const { data: peticiones, error: petError } = await supabase.from('peticiones').select('*');
    const { data: bitacora, error: bError } = await supabase.from('bitacora_entries').select('*');

    if (vError || pError || pkgError || petError || bError) {
        console.error({ vError, pError, pkgError, petError, bError });
        return <div>Error al cargar los datos.</div>
    }

    const activeVehicles = vehicular?.filter(v => !v.exitTimestamp) || [];
    const pendingPackages = packages?.filter(p => p.status !== 'Entregado') || [];
    const openPeticiones = peticiones?.filter(p => p.status === 'Abierta') || [];

    const activityFeedItems: ActivityFeedItem[] = [
      ...(vehicular || []).map(v => ({ id: v.id, type: 'vehicular' as const, date: v.entryTimestamp, text: `Entrada Vehicular: ${v.fullName}`, subtext: `Placa: ${v.licensePlate}` })),
      ...(pedestrian || []).map(p => ({ id: p.id, type: 'pedestrian' as const, date: p.entryTimestamp, text: `Entrada Peatonal: ${p.fullName}`, subtext: `Domicilio: ${p.address}` })),
      ...(bitacora || []).map(b => ({ id: b.id, type: 'bitacora' as const, date: b.createdAt, text: `Novedad: ${b.authorName}`, subtext: b.text.substring(0, 50) + '...' })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

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


export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboardContent />
        </Suspense>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-1/2" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-72" />
                <Skeleton className="lg:col-span-3 h-72" />
             </div>
        </div>
    );
}
