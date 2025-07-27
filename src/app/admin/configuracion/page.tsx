
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Settings, Lock, ListChecks, Phone, Calendar, Mail, Vote } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import type { User, RolePermission, PermissionModuleId } from "@/lib/definitions";
import { mockRolePermissions } from "@/lib/data";

const allConfigSections: { href: string; icon: React.ElementType; title: string; description: string; id: PermissionModuleId }[] = [
    { href: "/admin/configuracion/general", icon: Settings, title: "Ajustes Generales", description: "Configura el nombre de la empresa, notificaciones y apariencia.", id: 'configuracion' },
    { href: "/admin/configuracion/roles", icon: Lock, title: "Roles y Permisos", description: "Gestiona los roles de usuario y a qué módulos pueden acceder.", id: 'roles' },
    { href: "/admin/listas", icon: ListChecks, title: "Listas Desplegables", description: "Personaliza las opciones en los formularios de registro y pases.", id: 'listas' },
    { href: "/admin/emergencia", icon: Phone, title: "Contactos de Emergencia", description: "Define los números de emergencia para cada condominio.", id: 'emergencia' },
    { href: "/admin/calendario-eventos", icon: Calendar, title: "Eventos Comunitarios", description: "Publica y gestiona eventos y fechas importantes para residentes.", id: 'comunicados' }, // Shares permission
    { href: "/admin/comunicados", icon: Mail, title: "Comunicados Masivos", description: "Envía mensajes a todos los residentes de uno o más condominios.", id: 'comunicados' },
    { href: "/admin/encuestas", icon: Vote, title: "Encuestas y Votaciones", description: "Crea y gestiona encuestas para tomar decisiones comunitarias.", id: 'comunicados' } // Shares permission
];


export default function ConfiguracionHubPage() {
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

    const configSections = userPermissions 
        ? allConfigSections.filter(section => userPermissions.permissions[section.id]) 
        : [];
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
                <p className="text-muted-foreground">
                    Administra todos los ajustes y parámetros del sistema desde un solo lugar.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {configSections.map((section) => (
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
