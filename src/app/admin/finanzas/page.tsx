
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Wallet, FileText, Banknote } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User, RolePermission, PermissionModuleId } from "@/lib/definitions";
import { mockRolePermissions } from "@/lib/data";


const allFinanceSections: { href: string; icon: React.ElementType; title: string; description: string; id: PermissionModuleId }[] = [
    { href: "/admin/finanzas/nomina", icon: DollarSign, title: "Nómina y Cálculo", description: "Calcula, ajusta y procesa la nómina de los guardias de seguridad.", id: 'finanzas' },
    { href: "/admin/finanzas/cuotas", icon: Wallet, title: "Cuotas y Pagos", description: "Gestiona los cargos y pagos de las cuotas de mantenimiento de los residentes.", id: 'finanzas' },
    { href: "/admin/finanzas/prestamos", icon: Banknote, title: "Préstamos y Adelantos", description: "Aprueba y da seguimiento a las solicitudes de préstamos de los guardias.", id: 'finanzas' },
    { href: "/admin/finanzas/historial-nomina", icon: FileText, title: "Historial de Nómina", description: "Consulta y revisa todas las nóminas que han sido procesadas y archivadas.", id: 'finanzas' },
    { href: "/admin/reportes-financieros", icon: FileText, title: "Reportes Financieros", description: "Visualiza reportes consolidados de ingresos, egresos y balances.", id: 'finanzas' }
];

export default function FinanzasHubPage() {
    const [user, setUser] = useState<User | null>(null);
    const [userPermissions, setUserPermissions] = useState<RolePermission | undefined>(undefined);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            const permissions = mockRolePermissions.find(p => p.roleName === parsedUser.role);
            setUserPermissions(permissions);
        }
    }, []);
    
    const financeSections = userPermissions 
        ? allFinanceSections.filter(section => userPermissions.permissions[section.id]) 
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Finanzas</h2>
                <p className="text-muted-foreground">
                    Administra la nómina, las cuotas de residentes y los reportes financieros.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {financeSections.map((section) => (
                    <Card key={section.href} className="flex flex-col transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                            <div className="flex items-start gap-4">
                                <section.icon className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                                <div>
                                    <CardTitle>{section.title}</CardTitle>
                                    <CardDescription className="mt-2">{section.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardFooter className="mt-auto flex justify-end">
                            <Link href={section.href} passHref>
                                <Button>
                                    Gestionar <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
