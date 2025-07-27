
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, Package, BookText, HelpCircle, QrCode, CalendarClock, CalendarDays, Wrench, Sprout, Bell } from "lucide-react";
import Link from "next/link";
import type { User, RolePermission, PermissionModuleId } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { mockRolePermissions } from "@/lib/data";

const allOperationsSections: { href: string; icon: React.ElementType; title: string; description: string; id: PermissionModuleId }[] = [
    { href: "/admin/registros", icon: Car, title: "Registros de Acceso", description: "Consulta el historial de entradas y salidas vehiculares y peatonales.", id: 'registros' },
    { href: "/admin/paqueteria", icon: Package, title: "Paquetería", description: "Revisa el historial y estado de todos los paquetes recibidos.", id: 'paqueteria' },
    { href: "/admin/bitacora", icon: BookText, title: "Bitácora", description: "Revisa el historial de novedades y eventos reportados por los guardias.", id: 'bitacora' },
    { href: "/admin/peticiones", icon: HelpCircle, title: "Peticiones", description: "Gestiona y responde a las solicitudes y quejas de residentes y guardias.", id: 'peticiones' },
    { href: "/admin/pases-invitado", icon: QrCode, title: "Pases de Invitado", description: "Consulta el historial de pases QR generados por los usuarios.", id: 'pases_invitado' },
    { href: "/admin/asistencia", icon: CalendarClock, title: "Asistencia", description: "Visualiza el control de asistencia de los guardias por calendario.", id: 'asistencia' },
    { href: "/admin/planificador-turnos", icon: CalendarDays, title: "Planificador de Turnos", description: "Asigna guardias a los turnos de cada condominio.", id: 'asistencia' }, // Uses same permission as asistencia
    { href: "/admin/ordenes-trabajo", icon: Wrench, title: "Órdenes de Trabajo", description: "Gestiona y da seguimiento a las tareas de mantenimiento.", id: 'peticiones' }, // Uses same as peticiones
    { href: "/admin/areas-comunes", icon: Sprout, title: "Áreas Comunes", description: "Administra las áreas comunes y sus reservaciones.", id: 'pases_invitado' }, // Uses same as pases
    { href: "/admin/notificaciones", icon: Bell, title: "Notificaciones", description: "Consulta el historial de notificaciones de visita generadas.", id: 'notificaciones' },
];

export default function OperacionesHubPage() {
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

    const operationsSections = userPermissions 
        ? allOperationsSections.filter(section => userPermissions.permissions[section.id]) 
        : [];
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Operaciones</h2>
                <p className="text-muted-foreground">
                    Accede a las herramientas y registros de las operaciones diarias del sistema de seguridad.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {operationsSections.map((section) => (
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
                                    Ir a <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
