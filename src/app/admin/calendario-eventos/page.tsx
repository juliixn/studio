
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CommunityEvent, Condominio } from "@/lib/definitions";
import { getEvents, addEvent, updateEvent, deleteEvent } from "@/lib/eventService";
import { getCondominios } from "@/lib/condominioService";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EventForm } from "@/components/admin/event-form";

export default function CalendarioEventosPage() {
    const { toast } = useToast();
    const [events, setEvents] = useState<CommunityEvent[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CommunityEvent | undefined>(undefined);
    const [eventToDelete, setEventToDelete] = useState<CommunityEvent | undefined>(undefined);

    useEffect(() => {
        refreshData();
        setCondominios(getCondominios());
    }, []);

    const refreshData = () => setEvents(getEvents());

    const handleOpenForm = (event?: CommunityEvent) => {
        setEventToEdit(event);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setEventToEdit(undefined);
        setIsFormOpen(false);
    };

    const handleSubmit = (values: any) => {
        if (eventToEdit) {
            updateEvent(eventToEdit.id, values);
            toast({ title: "Evento actualizado" });
        } else {
            addEvent(values);
            toast({ title: "Evento creado" });
        }
        refreshData();
        handleCloseForm();
    };

    const handleDelete = () => {
        if (!eventToDelete) return;
        deleteEvent(eventToDelete.id);
        toast({ title: "Evento eliminado", variant: 'destructive' });
        refreshData();
        setEventToDelete(undefined);
    };

    const getTargetName = (condoId: string) => {
        if (condoId === 'all') return 'Todos los Condominios';
        return condominios.find(c => c.id === condoId)?.name || 'N/A';
    };

    const formatEventDate = (start: string, end: string, isAllDay: boolean) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isAllDay) {
            return format(startDate, "PPP", { locale: es });
        }
        return `${format(startDate, "PPP p", { locale: es })} - ${format(endDate, "p", { locale: es })}`;
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Calendario de Eventos</h2>
                        <p className="text-muted-foreground">Publica y gestiona eventos y fechas importantes para los residentes.</p>
                    </div>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Evento
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Card key={event.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{event.title}</CardTitle>
                                <CardDescription>{event.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground"/> {formatEventDate(event.start, event.end, event.isAllDay)}
                                </p>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground"/> Para: {getTargetName(event.condominioId)}
                                </p>
                                {event.location && <p className="text-sm font-medium">Ubicación: {event.location}</p>}
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenForm(event)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setEventToDelete(event)}><Trash2 className="h-4 w-4" /></Button>
                            </CardFooter>
                        </Card>
                    ))}
                     {events.length === 0 && (
                        <p className="col-span-full text-center text-muted-foreground py-10">No hay eventos programados.</p>
                    )}
                </div>
            </div>

            <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{eventToEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}</DialogTitle>
                    </DialogHeader>
                    <EventForm
                        event={eventToEdit}
                        condominios={condominios}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseForm}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Se eliminará el evento "{eventToDelete?.title}".</AlertDialogDescription>
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
