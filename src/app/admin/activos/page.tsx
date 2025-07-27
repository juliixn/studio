
"use client";

import { useState, useEffect } from "react";
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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Loader2 } from "lucide-react";
import type { Asset, Condominio } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { getAssets, addAsset, updateAsset, deleteAsset } from "@/lib/assetService";
import { getCondominios } from "@/lib/condominioService";
import { AssetForm } from "@/components/admin/asset-form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  category: z.string().min(1, "La categoría es requerida."),
  location: z.string().min(1, "La ubicación es requerida."),
  condominioId: z.string().min(1, "El condominio es requerido."),
  status: z.enum(['Operativo', 'En Mantenimiento', 'Requiere Reemplazo']),
  purchaseDate: z.date().optional(),
  lastMaintenanceDate: z.date().optional(),
  nextMaintenanceDate: z.date().optional(),
});


export default function ActivosPage() {
    const { toast } = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [availableCondos, setAvailableCondos] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState<Asset | undefined>(undefined);
    const [assetToDelete, setAssetToDelete] = useState<Asset | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        const [condosData, assetsData] = await Promise.all([
            getCondominios(),
            getAssets()
        ]);
        setAvailableCondos(condosData);
        setAssets(assetsData);
        setIsLoading(false);
    }
    
    useEffect(() => {
        refreshData();
    }, []);
    
    const handleOpenForm = (asset?: Asset) => {
        setAssetToEdit(asset);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setAssetToEdit(undefined);
    };
    
    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        const dataToSave = {
            ...values,
            purchaseDate: values.purchaseDate?.toISOString(),
            lastMaintenanceDate: values.lastMaintenanceDate?.toISOString(),
            nextMaintenanceDate: values.nextMaintenanceDate?.toISOString(),
        };

        if (assetToEdit) {
            await updateAsset(assetToEdit.id, dataToSave);
            toast({ title: "Activo actualizado" });
        } else {
            await addAsset(dataToSave);
            toast({ title: "Activo creado" });
        }
        await refreshData();
        handleCloseForm();
    };

    const handleDelete = async () => {
        if (!assetToDelete) return;
        await deleteAsset(assetToDelete.id);
        toast({ title: "Activo eliminado", variant: 'destructive' });
        await refreshData();
        setAssetToDelete(undefined);
    };

    const getCondoName = (condoId: string) => availableCondos.find(c => c.id === condoId)?.name || 'N/A';
    
    const getStatusVariant = (status: Asset['status']) => {
        switch (status) {
            case 'Operativo': return 'default';
            case 'En Mantenimiento': return 'secondary';
            case 'Requiere Reemplazo': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Gestión de Activos</CardTitle>
                            <CardDescription>Inventario y control de mantenimiento de los activos del condominio.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Registrar Activo
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Ubicación</TableHead>
                                    <TableHead>Próximo Mantenimiento</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : assets.map((asset) => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">{asset.name}</TableCell>
                                        <TableCell>{asset.category}</TableCell>
                                        <TableCell>{asset.location} ({getCondoName(asset.condominioId)})</TableCell>
                                        <TableCell>{asset.nextMaintenanceDate ? format(new Date(asset.nextMaintenanceDate), "PPP") : 'N/A'}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenForm(asset)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setAssetToDelete(asset)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
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

            <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{assetToEdit ? "Editar Activo" : "Registrar Nuevo Activo"}</DialogTitle>
                    </DialogHeader>
                    <AssetForm
                        asset={assetToEdit}
                        condominios={availableCondos}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará el activo "{assetToDelete?.name}". Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
