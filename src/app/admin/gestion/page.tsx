
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Home, Users, UserSquare, Package, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { User, RolePermission, PermissionModuleId } from "@/lib/definitions";
import { mockRolePermissions } from "@/lib/data";


const allGestionSections: { href: string; icon: React.ElementType; title: string; description: string; id: PermissionModuleId }[] = [
    { href: "/admin/condominios", icon: Building, title: "Condominios", description: "Crea, edita y gestiona los condominios del sistema.", id: 'condominio' },
    { href: "/admin/domicilios", icon: Home, title: "Domicilios", description: "Administra las direcciones individuales dentro de cada condominio.", id: 'condominio' }, // Uses same permission
    { href: "/admin/usuarios", icon: Users, title: "Usuarios", description: "Gestiona las cuentas de todos los usuarios: admins, guardias y residentes.", id: 'usuarios' },
    { href: "/admin/directorios", icon: UserSquare, title: "Directorio Unificado", description: "Consulta rápidamente a todos los usuarios por rol y condominio.", id: 'directorios' },
    { href: "/admin/activos", icon: Package, title: "Activos", description: "Gestiona el inventario y mantenimiento de los activos del condominio.", id: 'activos' },
    { href: "/admin/exportar-datos", icon: Download, title: "Exportar Datos", description: "Descarga los datos principales del sistema en formato CSV.", id: 'condominio' } // Uses same permission
];

export default function GestionHubPage() {
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

    const gestionSections = userPermissions 
        ? allGestionSections.filter(section => userPermissions.permissions[section.id]) 
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Gestión del Sistema</h2>
                <p className="text-muted-foreground">
                    Administra las entidades principales del sistema como condominios, usuarios y domicilios.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {gestionSections.map((section) => (
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
