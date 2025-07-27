
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { mockRolePermissions } from "@/lib/data";
import type { RolePermission, PermissionModuleId } from "@/lib/definitions";
import { permissionModules } from "@/lib/definitions";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Trash2, Lock, Unlock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function RolesPermisosPage() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<RolePermission[]>(mockRolePermissions);
    const [newRoleName, setNewRoleName] = useState("");

    const handlePermissionChange = (roleName: string, moduleId: PermissionModuleId, checked: boolean) => {
        setRoles(prevRoles =>
            prevRoles.map(role =>
                role.roleName === roleName
                    ? { ...role, permissions: { ...role.permissions, [moduleId]: checked } }
                    : role
            )
        );
    };

    const handleAddRole = () => {
        if (!newRoleName.trim()) {
            toast({ title: "Error", description: "El nombre del rol no puede estar vacío.", variant: "destructive" });
            return;
        }
        if (roles.some(role => role.roleName.toLowerCase() === newRoleName.trim().toLowerCase())) {
            toast({ title: "Error", description: "Ya existe un rol con ese nombre.", variant: "destructive" });
            return;
        }
        const newRole: RolePermission = {
            roleName: newRoleName.trim(),
            permissions: {},
            isDeletable: true,
        };
        setRoles(prev => [...prev, newRole]);
        setNewRoleName("");
        toast({ title: "Rol Creado", description: `Se ha creado el rol "${newRole.roleName}".` });
    };

    const handleDeleteRole = (roleName: string) => {
        setRoles(prev => prev.filter(role => role.roleName !== roleName));
        toast({ title: "Rol Eliminado", description: `Se ha eliminado el rol "${roleName}".`, variant: "destructive" });
    };

    const moduleIds = Object.keys(permissionModules) as PermissionModuleId[];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles y Permisos</h2>
                    <p className="text-muted-foreground">
                        Gestiona los roles de usuario y los módulos a los que pueden acceder.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Roles Existentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {roles.map(role => (
                                    <AccordionItem key={role.roleName} value={role.roleName}>
                                        <AccordionTrigger>
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <span className="text-lg font-medium">{role.roleName}</span>
                                                {!role.isDeletable ? (
                                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Se eliminará el rol "{role.roleName}".
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteRole(role.roleName)}>Sí, eliminar</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-4">
                                            <p className="text-sm text-muted-foreground mb-4">Seleccione los módulos a los que este rol tendrá acceso.</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {moduleIds.map(moduleId => (
                                                    <div key={moduleId} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`${role.roleName}-${moduleId}`}
                                                            checked={!!role.permissions[moduleId]}
                                                            onCheckedChange={(checked) => handlePermissionChange(role.roleName, moduleId, !!checked)}
                                                            disabled={role.roleName === 'Administrador'}
                                                        />
                                                        <label
                                                            htmlFor={`${role.roleName}-${moduleId}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {permissionModules[moduleId]}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
                <Card className="lg:col-span-1 sticky top-24">
                    <CardHeader>
                        <CardTitle>Crear Nuevo Rol</CardTitle>
                        <CardDescription>Añade un rol personalizado al sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                placeholder="Ej: Contador"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleAddRole} className="w-full">
                            <PlusCircle className="mr-2 h-4 w-4" /> Crear Rol
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
