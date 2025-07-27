
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
import { PlusCircle, MoreHorizontal, Edit, Trash2, Check, X, CalendarDays, LayoutGrid } from "lucide-react";
import type { CommonArea, Reservation, Condominio, ReservationStatus, User } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { getCommonAreas, addCommonArea, updateCommonArea, deleteCommonArea, getReservations, updateReservationStatus } from "@/lib/reservationService";
import { getCondominios } from "@/lib/condominioService";
import { CommonAreaForm } from "@/components/admin/common-area-form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
  capacity: z.coerce.number().min(1, "La capacidad debe ser mayor a 0."),
  condominioId: z.string().min(1, "El condominio es requerido."),
  imageUrl: z.string().url().optional().or(z.literal('')),
  rules: z.string().optional(),
  cost: z.coerce.number().min(0).optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export default function AreasComunesPage() {
    const { toast } = useToast();
    const [areas, setAreas] = useState<CommonArea[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [areaToEdit, setAreaToEdit] = useState<CommonArea | undefined>(undefined);
    const [areaToDelete, setAreaToDelete] = useState<CommonArea | undefined>(undefined);
    const [activeView, setActiveView] = useState('reservations');
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        
        const userCondoId = currentUser.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        const allCondos = getCondominios();
        
        if (userCondoId) {
            setCondominios(allCondos.filter(c => c.id === userCondoId));
        } else {
            setCondominios(allCondos);
        }
        
        refreshData(userCondoId);
    }, [currentUser]);

    const refreshData = (userCondoId?: string) => {
        setAreas(getCommonAreas(userCondoId));
        setReservations(getReservations(userCondoId));
    };

    const handleOpenForm = (area?: CommonArea) => {
        setAreaToEdit(area);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setAreaToEdit(undefined);
    };

    const handleSubmit = (values: z.infer<typeof formSchema>) => {
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        if (areaToEdit) {
            updateCommonArea(areaToEdit.id, values);
            toast({ title: "Área actualizada" });
        } else {
            addCommonArea(values);
            toast({ title: "Área creada" });
        }
        refreshData(userCondoId);
        handleCloseForm();
    };

    const handleDelete = () => {
        if (!areaToDelete) return;
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        deleteCommonArea(areaToDelete.id);
        toast({ title: "Área eliminada", variant: 'destructive' });
        refreshData(userCondoId);
        setAreaToDelete(undefined);
    };

    const handleReservationStatusUpdate = (id: string, status: ReservationStatus) => {
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        updateReservationStatus(id, status);
        toast({ title: "Reserva actualizada", description: `El estado ha cambiado a "${status}".` });
        refreshData(userCondoId);
    }
    
    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || 'N/A';
    
    const getStatusVariant = (status: ReservationStatus) => {
        switch (status) {
            case 'Aprobada': return 'default';
            case 'Pendiente': return 'secondary';
            case 'Rechazada': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                <Button variant={activeView === 'reservations' ? 'default' : 'outline'} onClick={() => setActiveView('reservations')}>
                    <CalendarDays className="mr-2 h-4 w-4"/> Gestionar Reservas
                </Button>
                <Button variant={activeView === 'areas' ? 'default' : 'outline'} onClick={() => setActiveView('areas')}>
                    <LayoutGrid className="mr-2 h-4 w-4"/> Gestionar Áreas
                </Button>
            </div>

            {activeView === 'reservations' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Reservas de Áreas Comunes</CardTitle>
                        <CardDescription>Aprueba o rechaza las solicitudes de reserva de los residentes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Área</TableHead>
                                        <TableHead>Residente</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Horario</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reservations.map((res) => (
                                        <TableRow key={res.id}>
                                            <TableCell>{res.areaName}</TableCell>
                                            <TableCell>{res.userName}</TableCell>
                                            <TableCell>{format(new Date(res.date), "PPP", { locale: es })}</TableCell>
                                            <TableCell>{res.startTime} - {res.endTime}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(res.status)}>{res.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                {res.status === 'Pendiente' && (
                                                    <div className="flex gap-2 justify-end">
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => handleReservationStatusUpdate(res.id, 'Aprobada')}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600" onClick={() => handleReservationStatusUpdate(res.id, 'Rechazada')}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeView === 'areas' && (
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle>Áreas Comunes</CardTitle>
                                <CardDescription>Define las áreas que los residentes pueden reservar.</CardDescription>
                            </div>
                            <Button onClick={() => handleOpenForm()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Área
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Condominio</TableHead>
                                        <TableHead>Capacidad</TableHead>
                                        <TableHead>Costo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {areas.map((area) => (
                                        <TableRow key={area.id}>
                                            <TableCell className="font-medium">{area.name}</TableCell>
                                            <TableCell>{getCondoName(area.condominioId)}</TableCell>
                                            <TableCell>{area.capacity} personas</TableCell>
                                            <TableCell>{area.cost ? `$${area.cost.toFixed(2)}` : 'Gratis'}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleOpenForm(area)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setAreaToDelete(area)} className="text-destructive">
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
            )}

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{areaToEdit ? "Editar Área Común" : "Crear Nueva Área Común"}</DialogTitle>
                    </DialogHeader>
                    <CommonAreaForm
                        area={areaToEdit}
                        condominios={condominios}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el área "{areaToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
