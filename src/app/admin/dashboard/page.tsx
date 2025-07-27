
import { getVehicularRegistrations, getPedestrianRegistrations } from "@/lib/registrationService";
import { getPackages } from "@/lib/packageService";
import { getPeticiones } from "@/lib/peticionService";
import { getBitacora } from "@/lib/bitacoraService";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDashboardClient from "./dashboard-client";

async function getDashboardData() {
    // Since we're using client-side storage, we can't fetch data on the server.
    // We'll return empty arrays and let the client-side component fetch the data.
    return {
        vehicular: [],
        pedestrian: [],
        packages: [],
        peticiones: [],
        bitacora: [],
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
    // The initial data will be empty, client component will fetch.
    const dashboardData = await getDashboardData();
    
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <AdminDashboardClient initialData={dashboardData} />
        </Suspense>
    );
}
