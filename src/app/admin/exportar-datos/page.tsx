
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Building, Home, Car } from "lucide-react";
import Papa from "papaparse";

import { getUsers } from "@/lib/userService";
import { getCondominios } from "@/lib/condominioService";
import { getDomicilios } from "@/lib/domicilioService";
import { getUserVehicles } from "@/lib/vehicleService"; // Assuming a function to get all vehicles might be complex. Let's get them per user and aggregate.

import type { User, Condominio, Address, VehicleInfo } from "@/lib/definitions";

type ExportableData = User[] | Condominio[] | Address[] | VehicleInfo[];

function downloadCSV(data: ExportableData, filename: string) {
    if (data.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function ExportarDatosPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [vehicles, setVehicles] = useState<(VehicleInfo & { ownerId: string })[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const usersData = await getUsers();
            setUsers(usersData);
            setCondominios(await getCondominios());
            setAddresses(await getDomicilios());

            // Aggregate all vehicles from all users
            let allVehicles: (VehicleInfo & { ownerId: string })[] = [];
            for (const user of usersData) {
                const userVehicles = await getUserVehicles(user.id);
                const vehiclesWithOwner = userVehicles.map(v => ({...v, ownerId: user.id}));
                allVehicles = [...allVehicles, ...vehiclesWithOwner];
            }
            setVehicles(allVehicles);
        };
        fetchData();
    }, []);

    const exportSections = [
        {
            title: "Usuarios",
            description: "Exporta una lista de todos los usuarios registrados en el sistema.",
            icon: Users,
            action: () => downloadCSV(users, "usuarios.csv"),
            count: users.length
        },
        {
            title: "Condominios",
            description: "Exporta una lista de todos los condominios configurados.",
            icon: Building,
            action: () => downloadCSV(condominios, "condominios.csv"),
            count: condominios.length
        },
        {
            title: "Domicilios",
            description: "Exporta una lista completa de todos los domicilios registrados.",
            icon: Home,
            action: () => downloadCSV(addresses, "domicilios.csv"),
            count: addresses.length
        },
        {
            title: "Vehículos de Residentes",
            description: "Exporta una lista de todos los vehículos que los residentes han guardado.",
            icon: Car,
            action: () => downloadCSV(vehicles, "vehiculos.csv"),
            count: vehicles.length
        }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Exportar Datos</h2>
                <p className="text-muted-foreground">
                    Descarga los datos principales de tu aplicación en formato CSV para utilizarlos en otras plataformas.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {exportSections.map((section) => (
                    <Card key={section.title} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <section.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <CardTitle>{section.title}</CardTitle>
                                    <CardDescription className="mt-2">{section.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground">{section.count} registros encontrados.</p>
                        </CardContent>
                        <CardFooter className="mt-auto flex justify-end">
                            <Button onClick={section.action} disabled={section.count === 0}>
                                <Download className="mr-2 h-4 w-4" /> Exportar a CSV
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
