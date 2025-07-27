
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
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import type { WorkOrder, Condominio, User } from "@/lib/definitions";
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
import { getWorkOrders, addWorkOrder, updateWorkOrder, deleteWorkOrder } from "@/lib/workOrderService";
import { getCondominios } from "@/lib/condominioService";
import { WorkOrderForm } from "@/components/admin/work-order-form";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function OrdenesTrabajoPage() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<WorkOrder | undefined>(undefined);
    const [orderToDelete, setOrderToDelete] = useState<WorkOrder | undefined>(undefined);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);
    
    useEffect(() => {
        if (!currentUser) return;

        const allCondos = getCondominios();
        const userCondoId = currentUser.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        
        if (userCondoId) {
            setCondominios(allCondos.filter(c => c.id === userCondoId));
        } else {
            setCondominios(allCondos);
        }
        
        refreshData(userCondoId);
    }, [currentUser]);

    const refreshData = (userCondoId?: string) => {
        setOrders(getWorkOrders(userCondoId));
    };

    const handleOpenForm = (order?: WorkOrder) => {
        setOrderToEdit(order);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setOrderToEdit(undefined);
        setIsFormOpen(false);
    };

    const handleSubmit = (values: any) => {
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        if (orderToEdit) {
            updateWorkOrder(orderToEdit.id, values);
            toast({ title: "Orden actualizada" });
        } else {
            addWorkOrder(values);
            toast({ title: "Orden creada" });
        }
        refreshData(userCondoId);
        handleCloseForm();
    };

    const handleDelete = () => {
        if (!orderToDelete) return;
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        deleteWorkOrder(orderToDelete.id);
        toast({ title: "Orden eliminada", variant: 'destructive' });
        refreshData(userCondoId);
        setOrderToDelete(undefined);
    };
    
    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || getCondominios().find(c => c.id === condoId)?.name || 'N/A';
    
     const getStatusVariant = (status: WorkOrder['status']) => {
        switch (status) {
            case 'Completada': return 'default';
            case 'En Progreso': return 'secondary';
            case 'Pendiente': return 'outline';
            case 'Asignada': return 'outline';
            case 'Cancelada': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Órdenes de Trabajo</CardTitle>
                            <CardDescription>Asigna, gestiona y da seguimiento a las tareas de mantenimiento.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Orden
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Condominio</TableHead>
                                    <TableHead>Asignado a</TableHead>
                                    <TableHead>Costo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.title}</TableCell>
                                        <TableCell>{getCondoName(order.condominioId)}</TableCell>
                                        <TableCell>{order.assignedTo || 'N/A'}</TableCell>
                                        <TableCell>{order.cost ? `$${order.cost.toFixed(2)}` : 'N/A'}</TableCell>
                                        <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenForm(order)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setOrderToDelete(order)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
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
                        <DialogTitle>{orderToEdit ? "Editar Orden de Trabajo" : "Crear Nueva Orden de Trabajo"}</DialogTitle>
                    </DialogHeader>
                    <WorkOrderForm
                        workOrder={orderToEdit}
                        condominios={condominios}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará la orden de trabajo "{orderToDelete?.title}".</AlertDialogDescription>
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
