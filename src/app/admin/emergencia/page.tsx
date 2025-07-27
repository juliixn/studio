
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
import type { EmergencyContact, Condominio } from "@/lib/definitions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "@/lib/emergencyService";
import { getCondominios } from "@/lib/condominioService";
import { EmergencyContactForm } from "@/components/admin/emergencia-form";

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  phone: z.string().min(1, "El teléfono es requerido."),
  description: z.string().optional(),
  condominioId: z.string().min(1, "El condominio es requerido."),
});

export default function EmergenciaPage() {
    const { toast } = useToast();
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [contactToEdit, setContactToEdit] = useState<EmergencyContact | undefined>(undefined);
    const [contactToDelete, setContactToDelete] = useState<EmergencyContact | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        const [contactsData, condosData] = await Promise.all([
            getEmergencyContacts(),
            getCondominios()
        ]);
        setContacts(contactsData);
        setCondominios(condosData);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const handleOpenForm = (contact?: EmergencyContact) => {
        setContactToEdit(contact);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setContactToEdit(undefined);
    };

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        if (contactToEdit) {
            await updateEmergencyContact(contactToEdit.id, values);
            toast({ title: "Contacto actualizado", description: `El contacto "${values.name}" ha sido actualizado.` });
        } else {
            await addEmergencyContact(values);
            toast({ title: "Contacto creado", description: `El contacto "${values.name}" ha sido creado.` });
        }
        await refreshData();
        handleCloseForm();
    };

    const handleDelete = async () => {
        if (!contactToDelete) return;
        
        await deleteEmergencyContact(contactToDelete.id);
        toast({ title: "Contacto eliminado", description: `El contacto "${contactToDelete.name}" ha sido eliminado.`, variant: 'destructive' });
        await refreshData();
        setContactToDelete(undefined);
    };

    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || 'N/A';

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Contactos de Emergencia</CardTitle>
                            <CardDescription>Gestiona los contactos de emergencia para cada condominio.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenForm()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Contacto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Condominio</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : contacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell className="font-medium">{contact.name}</TableCell>
                                        <TableCell>{contact.phone}</TableCell>
                                        <TableCell>{contact.description}</TableCell>
                                        <TableCell>{getCondoName(contact.condominioId)}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => handleOpenForm(contact)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setContactToDelete(contact)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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

            <Dialog open={isFormOpen} onOpenChange={(open) => !open && handleCloseForm()}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{contactToEdit ? "Editar Contacto" : "Crear Nuevo Contacto"}</DialogTitle>
                        <DialogDescription>
                            {contactToEdit 
                                ? "Modifica los detalles del contacto."
                                : "Completa el formulario para agregar un nuevo contacto de emergencia."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <EmergencyContactForm
                        condominios={condominios}
                        contact={contactToEdit}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el contacto
                             "{contactToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setContactToDelete(undefined)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
