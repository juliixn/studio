
"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from 'next/navigation';
import { getVehicularRegistrations, getPedestrianRegistrations } from "@/lib/registrationService";
import { getPackages } from "@/lib/packageService";
import { getReservations } from "@/lib/reservationService";
import { getUserById } from "@/lib/userService";
import { getCondominios } from "@/lib/condominioService";
import { getDomicilios } from "@/lib/domicilioService";
import type { User, VehicularRegistration, PedestrianRegistration, Package, Reservation, Condominio, Address } from "@/lib/definitions";
import UserProfileView from "@/components/admin/user-profile-view";
import Loading from "./loading";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function UserProfilePageContent() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<User | null>(null);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [allAddresses, setAllAddresses] = useState<Address[]>([]);
    const [accessHistory, setAccessHistory] = useState<(VehicularRegistration | PedestrianRegistration)[]>([]);
    const [packageHistory, setPackageHistory] = useState<Package[]>([]);
    const [reservationHistory, setReservationHistory] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                const foundUser = await getUserById(userId);
                if (foundUser) {
                    setUser(foundUser);
                    
                    const [
                        condosData,
                        addressesData,
                        vehicularData,
                        pedestrianData,
                        packagesData,
                        reservationsData
                    ] = await Promise.all([
                        getCondominios(),
                        getDomicilios(),
                        getVehicularRegistrations(),
                        getPedestrianRegistrations(),
                        getPackages(undefined, foundUser.id),
                        getReservations(undefined, foundUser.id)
                    ]);

                    setCondominios(condosData);
                    setAllAddresses(addressesData);
                    
                    const vehicular = vehicularData.filter(r => r.fullName === foundUser.name);
                    const pedestrian = pedestrianData.filter(r => r.fullName === foundUser.name);
                    setAccessHistory([...vehicular, ...pedestrian].sort((a, b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime()));
                    setPackageHistory(packagesData);
                    setReservationHistory(reservationsData);

                } else {
                    router.push('/admin/usuarios'); // User not found, redirect
                }
                setLoading(false);
            };
            fetchData();
        }
    }, [userId, router]);

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return (
            <div className="text-center">
                <p>Usuario no encontrado.</p>
                <Button asChild variant="link"><Link href="/admin/usuarios">Volver a la lista</Link></Button>
            </div>
        );
    }

    const condominioNames = user.condominioIds 
        ? user.condominioIds.map(id => condominios.find(c => c.id === id)?.name).filter(Boolean) as string[]
        : (user.condominioId ? [condominios.find(c => c.id === user.condominioId)?.name].filter(Boolean) as string[] : []);

    const addressNames = user.addressIds
        ? user.addressIds.map(id => allAddresses.find(a => a.id === id)?.fullAddress).filter(Boolean) as string[]
        : (user.addressId ? [allAddresses.find(a => a.id === user.addressId)?.fullAddress].filter(Boolean) as string[] : []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/admin/usuarios"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Perfil de Usuario</h2>
            </div>
            <UserProfileView
                user={user}
                condominioNames={condominioNames}
                addressNames={addressNames}
                accessHistory={accessHistory}
                packageHistory={packageHistory}
                reservationHistory={reservationHistory}
            />
        </div>
    );
}

export default function UserProfilePage() {
    return (
        <Suspense fallback={<Loading />}>
            <UserProfilePageContent />
        </Suspense>
    );
}
