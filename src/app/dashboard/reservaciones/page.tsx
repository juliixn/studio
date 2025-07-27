
"use client";

import { useState, useEffect } from "react";
import { getCommonAreas, getReservations, addReservation } from "@/lib/reservationService";
import type { CommonArea, Reservation, User, Address, ReservationStatus } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { allAddresses } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns/format";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const reservationFormSchema = z.object({
  date: z.date({ required_error: "Se requiere una fecha." }),
  startTime: z.string().min(1, "Se requiere hora de inicio."),
  endTime: z.string().min(1, "Se requiere hora de fin."),
});

function ReservationDialog({ area, user, onClose, onConfirm }: { area: CommonArea, user: User, onClose: () => void, onConfirm: () => void }) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof reservationFormSchema>>({
        resolver: zodResolver(reservationFormSchema),
    });

    const onSubmit = (values: z.infer<typeof reservationFormSchema>) => {
        addReservation({
            areaId: area.id,
            areaName: area.name,
            userId: user.id,
            userName: user.name,
            date: values.date.toISOString().split('T')[0],
            startTime: values.startTime,
            endTime: values.endTime,
            condominioId: area.condominioId
        });
        toast({ title: "Solicitud Enviada", description: "Tu solicitud de reserva ha sido enviada para aprobación." });
        onConfirm();
        onClose();
    };
    
    // Example time slots, this could be more dynamic
    const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reservar: {area.name}</DialogTitle>
                <DialogDescription>Completa los detalles para tu reserva. Tu solicitud será revisada por la administración.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Reserva</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant={"outline"} className={cn(!field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    locale={es}
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="startTime" render={({ field }) => (
                            <FormItem><FormLabel>Hora Inicio</FormLabel><FormControl><Input type="time" placeholder="14:00" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                            <FormItem><FormLabel>Hora Fin</FormLabel><FormControl><Input type="time" placeholder="18:00" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Enviar Solicitud</Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
}

export default function ReservacionesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [areas, setAreas] = useState<CommonArea[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [areaToReserve, setAreaToReserve] = useState<CommonArea | null>(null);

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
            if (storedUser.condominioId) {
                setAreas(getCommonAreas(storedUser.condominioId));
                setReservations(getReservations(undefined, storedUser.id));
            }
        }
    }, []);

    const refreshReservations = () => {
        if(user) {
            setReservations(getReservations(undefined, user.id));
        }
    }

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
            <div className="flex items-center gap-4">
                <Link href="/dashboard" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver al panel">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reservación de Áreas Comunes</h2>
                    <p className="text-muted-foreground">Explora y reserva las áreas comunes de tu condominio.</p>
                </div>
            </div>

            <section>
                <h3 className="text-xl font-semibold mb-4">Áreas Disponibles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areas.map(area => (
                        <Card key={area.id}>
                            <CardHeader className="p-0">
                                <div className="relative aspect-video">
                                     <Image src={area.imageUrl || "https://placehold.co/600x400.png"} alt={area.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="common area"/>
                                </div>
                               <div className="p-4">
                                 <CardTitle>{area.name}</CardTitle>
                                 <CardDescription>{area.description}</CardDescription>
                               </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4"/> Capacidad: {area.capacity} personas
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => setAreaToReserve(area)}>Reservar</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold mb-4">Mis Reservas</h3>
                <Card>
                    <CardContent className="pt-6">
                        {reservations.length > 0 ? (
                            <ul className="space-y-3">
                                {reservations.map(res => (
                                    <li key={res.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border rounded-md gap-2">
                                        <div>
                                            <p className="font-semibold">{res.areaName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(res.date), "PPP", { locale: es })} de {res.startTime} a {res.endTime}
                                            </p>
                                        </div>
                                        <Badge variant={getStatusVariant(res.status)}>{res.status}</Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes ninguna reserva.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Dialog open={!!areaToReserve} onOpenChange={(open) => !open && setAreaToReserve(null)}>
                {areaToReserve && user && (
                    <ReservationDialog 
                        area={areaToReserve}
                        user={user}
                        onClose={() => setAreaToReserve(null)}
                        onConfirm={refreshReservations}
                    />
                )}
            </Dialog>
        </div>
    );
}
