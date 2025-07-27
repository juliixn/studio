
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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Upload, Download, Sparkles, Loader2 } from "lucide-react";
import { getDomicilios, addDomicilio, updateDomicilio, deleteDomicilio, addDomicilios } from "@/lib/domicilioService";
import { getCondominios } from "@/lib/condominioService";
import type { Address, Condominio, User } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DomicilioForm } from "@/components/admin/domicilio-form";
import { DomicilioMasivoForm } from "@/components/admin/domicilio-masivo-form";
import { DomicilioImportDialog } from "@/components/admin/domicilio-import-dialog";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Papa from "papaparse";

const formSchema = z.object({
  fullAddress: z.string().min(1, "La dirección es requerida."),
  condominioId: z.string().min(1, "El condominio es requerido."),
});

const massFormSchema = z.object({
  condominioId: z.string().min(1, "El condominio es requerido."),
  prefix: z.string().min(1, "El prefijo es requerido (ej: Casa, Lote)."),
  startNumber: z.coerce.number().int().positive("El número inicial debe ser positivo."),
  endNumber: z.coerce.number().int().positive("El número final debe ser positivo."),
  suffix: z.string().optional(),
});


export default function DomiciliosPage() {
    const { toast } = useToast();
    const [domicilios, setDomicilios] = useState<Address[]>([]);
    const [availableCondos, setAvailableCondos] = useState<Condominio[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Dialog states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMassiveFormOpen, setIsMassiveFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    // Edit/Delete states
    const [domicilioToEdit, setDomicilioToEdit] = useState<Address | undefined>(undefined);
    const [domicilioToDelete, setDomicilioToDelete] = useState<Address | undefined>(undefined);
    
    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const [condosData, domiciliosData] = await Promise.all([
            getCondominios(),
            getDomicilios()
        ]);
        
        if (currentUser?.role === 'Adm. Condo' && currentUser.condominioId) {
            setAvailableCondos(condosData.filter(c => c.id === currentUser.condominioId));
            setDomicilios(domiciliosData.filter(d => d.condominioId === currentUser.condominioId));
        } else {
            setAvailableCondos(condosData);
            setDomicilios(domiciliosData);
        }
        setIsLoading(false);
    }
    
    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);
    
    const getCondoName = (condoId: string) => {
        return availableCondos.find(c => c.id === condoId)?.name || 'N/A';
    }

    const handleOpenForm = (domicilio?: Address) => {
        setDomicilioToEdit(domicilio);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setDomicilioToEdit(undefined);
    };

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        if (domicilioToEdit) {
            await updateDomicilio(domicilioToEdit.id, values);
            toast({ title: "Domicilio actualizado", description: `El domicilio ha sido actualizado.` });
        } else {
            await addDomicilio(values);
            toast({ title: "Domicilio creado", description: `El domicilio ha sido creado.` });
        }
        await fetchData();
        handleCloseForm();
    };

    const handleDelete = async () => {
        if (!domicilioToDelete) return;
        await deleteDomicilio(domicilioToDelete.id);
        toast({ title: "Domicilio eliminado", description: `El domicilio "${domicilioToDelete.fullAddress}" ha sido eliminado.`, variant: 'destructive' });
        await fetchData();
        setDomicilioToDelete(undefined);
    };
    
    const handleMassiveSubmit = async (values: z.infer<typeof massFormSchema>) => {
        const newDomicilios: Omit<Address, "id">[] = [];
        for (let i = values.startNumber; i <= values.endNumber; i++) {
            const fullAddress = `${values.prefix} ${i}${values.suffix || ''}`.trim();
            newDomicilios.push({
                fullAddress,
                condominioId: values.condominioId,
            });
        }
        await addDomicilios(newDomicilios);
        toast({ title: "Creación Exitosa", description: `${newDomicilios.length} domicilios han sido creados.`});
        await fetchData();
        setIsMassiveFormOpen(false);
    };

    const handleExport = () => {
        const dataToExport = domicilios.map(d => ({ fullAddress: d.fullAddress, condominioId: d.condominioId }));
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'domicilios.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportación Exitosa", description: "Se ha descargado el archivo de domicilios." });
    };

    const handleImport = async (newDomicilios: Omit<Address, "id">[]) => {
        await addDomicilios(newDomicilios);
        await fetchData();
        setIsImportOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Domicilios</CardTitle>
                            <CardDescription>Gestiona los domicilios dentro de los condominios.</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsImportOpen(true)}><Upload className="mr-2 h-4 w-4"/>Importar</Button>
                            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                            <Button onClick={() => setIsMassiveFormOpen(true)}><Sparkles className="mr-2 h-4 w-4"/>Creación Masiva</Button>
                            <Button onClick={() => handleOpenForm()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Domicilio
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dirección Completa</TableHead>
                                    <TableHead>Condominio</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                     <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : domicilios.map((address) => (
                                    <TableRow key={address.id}>
                                        <TableCell className="font-medium">{address.fullAddress}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{getCondoName(address.condominioId)}</Badge>
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
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem onClick={() => handleOpenForm(address)}>
                                                        <Edit className="mr-2 h-4 w-4"/>
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDomicilioToDelete(address)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                        <Trash2 className="mr-2 h-4 w-4"/>
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

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{domicilioToEdit ? "Editar Domicilio" : "Crear Nuevo Domicilio"}</DialogTitle>
                        <DialogDescription>
                           {domicilioToEdit ? "Modifica los detalles del domicilio." : "Completa el formulario para agregar un nuevo domicilio."}
                        </DialogDescription>
                    </DialogHeader>
                    <DomicilioForm 
                        domicilio={domicilioToEdit}
                        condominios={availableCondos}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isMassiveFormOpen} onOpenChange={setIsMassiveFormOpen}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Creación Masiva de Domicilios</DialogTitle>
                        <DialogDescription>Genera domicilios con numeración consecutiva para un condominio.</DialogDescription>
                    </DialogHeader>
                    <DomicilioMasivoForm 
                        condominios={availableCondos}
                        onSubmit={handleMassiveSubmit}
                        onCancel={() => setIsMassiveFormOpen(false)}
                    />
                 </DialogContent>
            </Dialog>

            <DomicilioImportDialog 
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onImport={handleImport}
            />

            <AlertDialog open={!!domicilioToDelete} onOpenChange={(open) => !open && setDomicilioToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el domicilio
                             "{domicilioToDelete?.fullAddress}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDomicilioToDelete(undefined)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
