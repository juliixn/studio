
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Edit, Trash2, PowerOff, Power, Loader2 } from "lucide-react";
import { getCondominios, deleteCondominio, updateCondominio } from "@/lib/condominioService";
import type { Condominio } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CondominiosPage() {
    const { toast } = useToast();
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [condoToDelete, setCondoToDelete] = useState<Condominio | undefined>(undefined);
    const [condoToToggleStatus, setCondoToToggleStatus] = useState<Condominio | undefined>(undefined);

    const refreshCondos = async () => {
        setIsLoading(true);
        const data = await getCondominios();
        setCondominios(data);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshCondos();
    }, []);

    const handleDelete = async () => {
        if (!condoToDelete) return;
        await deleteCondominio(condoToDelete.id);
        toast({ title: "Condominio eliminado", description: `El condominio "${condoToDelete.name}" ha sido eliminado.`, variant: 'destructive' });
        setCondoToDelete(undefined);
        await refreshCondos();
    };
    
    const handleToggleStatus = async () => {
        if (!condoToToggleStatus) return;
        const newStatus = condoToToggleStatus.status === 'Activo' ? 'Suspendido' : 'Activo';
        await updateCondominio(condoToToggleStatus.id, { status: newStatus });
        toast({ title: `Estado Actualizado`, description: `El condominio "${condoToToggleStatus.name}" ahora está ${newStatus.toLowerCase()}.` });
        setCondoToToggleStatus(undefined);
        await refreshCondos();
    };
    

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Condominios</CardTitle>
                            <CardDescription>Gestiona los condominios del sistema.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/admin/condominios/crear">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Condominio
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Dirección Principal</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : condominios.map((condo, index) => (
                                    <TableRow key={condo.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
                                        <TableCell className="font-medium">{condo.name}</TableCell>
                                        <TableCell>{condo.mainAddress}</TableCell>
                                        <TableCell>
                                            <Badge variant={condo.status === 'Activo' ? 'default' : 'destructive'}>{condo.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/condominios/${condo.id}/editar`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setCondoToToggleStatus(condo)}>
                                                        {condo.status === 'Activo' ? <PowerOff className="mr-2 h-4 w-4 text-amber-600" /> : <Power className="mr-2 h-4 w-4 text-green-600" />}
                                                        {condo.status === 'Activo' ? 'Suspender' : 'Reactivar'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setCondoToDelete(condo)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <AlertDialog open={!!condoToToggleStatus} onOpenChange={(open) => !open && setCondoToToggleStatus(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Se {condoToToggleStatus?.status === 'Activo' ? 'suspenderá' : 'reactivará'} el servicio para el condominio "{condoToToggleStatus?.name}".
                           {condoToToggleStatus?.status === 'Activo' && " Los usuarios de este condominio (excepto guardias) no podrán iniciar sesión."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleToggleStatus}>Sí, confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!condoToDelete} onOpenChange={(open) => !open && setCondoToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el condominio
                             "{condoToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
