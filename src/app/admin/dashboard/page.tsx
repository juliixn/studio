
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboardClient from "./dashboard-client";

async function getDashboardData() {
    const supabase = createClient();
    
    // Fetch all data in parallel
    const [
        vehicularResult,
        pedestrianResult,
        packagesResult,
        peticionesResult,
        bitacoraResult
    ] = await Promise.all([
        supabase.from('vehicular_registrations').select('*'),
        supabase.from('pedestrian_registrations').select('*'),
        supabase.from('packages').select('*'),
        supabase.from('peticiones').select('*'),
        supabase.from('bitacora_entries').select('*')
    ]);

    // Handle potential errors for each query
    if (vehicularResult.error) console.error("Error fetching vehicular data:", vehicularResult.error);
    if (pedestrianResult.error) console.error("Error fetching pedestrian data:", pedestrianResult.error);
    if (packagesResult.error) console.error("Error fetching packages data:", packagesResult.error);
    if (peticionesResult.error) console.error("Error fetching peticiones data:", peticionesResult.error);
    if (bitacoraResult.error) console.error("Error fetching bitacora data:", bitacoraResult.error);

    return {
        vehicular: vehicularResult.data || [],
        pedestrian: pedestrianResult.data || [],
        packages: packagesResult.data || [],
        peticiones: peticionesResult.data || [],
        bitacora: bitacoraResult.data || [],
    };
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

export default async function AdminDashboardPage() {
    const dashboardData = await getDashboardData();
    
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboardClient initialData={dashboardData} />
        </Suspense>
    );
}
