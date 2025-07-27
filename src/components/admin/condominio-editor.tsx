
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Shield, Save, Loader2, List, Car, User, Package, BookText, LogOutIcon, Bell, CalendarClock, MessageSquare, Wallet, History as HistoryIcon } from 'lucide-react';
import type { Condominio, User, GuardMenuSection } from '@/lib/definitions';
import { getUsers } from '@/lib/userService';
import { Slider } from '../ui/slider';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(() => import('./interactive-map'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg" /> 
});

type LocationPin = { lat: number; lng: number };

const guardMenuOptions: { id: GuardMenuSection; label: string; icon: React.ReactNode }[] = [
    { id: 'vehicular', label: 'Registro Vehicular', icon: <Car className="h-4 w-4" /> },
    { id: 'pedestrian', label: 'Registro Peatonal', icon: <User className="h-4 w-4" /> },
    { id: 'packages', label: 'Paquetería', icon: <Package className="h-4 w-4" /> },
    { id: 'bitacora', label: 'Bitácora / Incidentes', icon: <BookText className="h-4 w-4" /> },
    { id: 'active_exits', label: 'Salidas Activas', icon: <LogOutIcon className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notificaciones Activas', icon: <Bell className="h-4 w-4" /> },
    { id: 'reservations', label: 'Reservaciones de Hoy', icon: <CalendarClock className="h-4 w-4" /> },
    { id: 'peticiones', label: 'Peticiones', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'my_payroll', label: 'Mi Nómina', icon: <HistoryIcon className="h-4 w-4" /> },
    { id: 'my_loans', label: 'Mis Préstamos', icon: <Wallet className="h-4 w-4" /> },
];

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  mainAddress: z.string().min(1, "La dirección es requerida."),
  guardIds: z.array(z.string()).optional(),
  geofenceRadius: z.coerce.number().optional(),
  guardsRequiredDiurno: z.coerce.number().int().min(1, "Debe ser al menos 1").optional(),
  guardsRequiredNocturno: z.coerce.number().int().min(1, "Debe ser al menos 1").optional(),
  guardMenuSections: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CondominioEditorProps {
    initialData?: Condominio;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    isPending?: boolean;
}

export default function CondominioEditor({ initialData, onSubmit, onCancel, isPending = false }: CondominioEditorProps) {
    const [step, setStep] = useState(1);
    const [users, setUsers] = useState<User[]>([]);
    const [pinLocation, setPinLocation] = useState<LocationPin | null>(
        initialData?.latitude && initialData?.longitude 
        ? { lat: initialData.latitude, lng: initialData.longitude }
        : null
    );

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialData?.name || '',
            mainAddress: initialData?.mainAddress || '',
            guardIds: initialData?.guardIds || [],
            geofenceRadius: initialData?.geofenceRadius || 200,
            guardsRequiredDiurno: initialData?.guardsRequiredDiurno || 1,
            guardsRequiredNocturno: initialData?.guardsRequiredNocturno || 1,
            guardMenuSections: initialData?.guardMenuSections || [],
        },
    });

    useEffect(() => {
        const fetchUsers = async () => {
            const usersData = await getUsers();
            setUsers(usersData);
        };
        fetchUsers();
    }, []);

    const handleFormSubmit = (data: FormData) => {
        const finalData = {
            ...data,
            latitude: pinLocation?.lat,
            longitude: pinLocation?.lng,
        };
        onSubmit(finalData);
    };
    
    const guards = useMemo(() => users.filter(u => u.role === 'Guardia'), [users]);
    const mapKey = useMemo(() => Date.now(), []);
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" size="icon" onClick={onCancel}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {initialData ? `Editando: ${initialData.name}` : 'Crear Nuevo Condominio'}
                        </h2>
                        <p className="text-muted-foreground">Paso {step} de 3: {step === 1 ? "Información y Ubicación" : step === 2 ? "Asignación de Guardias" : "Menú del Guardia"}</p>
                    </div>
                </div>

                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Paso 1: Información y Ubicación</CardTitle>
                            <CardDescription>Define el nombre, dirección y la ubicación GPS del condominio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nombre del Condominio</FormLabel><FormControl><Input placeholder="Residencial Los Robles" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="mainAddress" render={({ field }) => (
                                        <FormItem><FormLabel>Dirección Principal</FormLabel><FormControl><Input placeholder="Av. Principal 123" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="guardsRequiredDiurno"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Guardias por Turno (Día)</FormLabel>
                                                    <FormControl><Input type="number" min="1" placeholder="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="guardsRequiredNocturno"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Guardias por Turno (Noche)</FormLabel>
                                                    <FormControl><Input type="number" min="1" placeholder="1" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 h-[400px] md:h-auto flex flex-col">
                                    <FormLabel>Ubicación en el Mapa</FormLabel>
                                    <div className="flex-grow w-full rounded-lg overflow-hidden border" key={mapKey}>
                                        <InteractiveMap 
                                        position={pinLocation} 
                                        onPositionChange={setPinLocation}
                                        />
                                    </div>
                                    <FormDescription>Haz clic en el mapa o arrastra el pin para ajustar la ubicación.</FormDescription>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <FormField control={form.control} name="geofenceRadius" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Distancia para Inicio de Turno (Metros)</FormLabel>
                                        <FormDescription>Radio en metros desde el pin de ubicación para validar el inicio de turno de los guardias.</FormDescription>
                                        <div className="flex items-center gap-4 pt-2">
                                            <FormControl>
                                                <Slider
                                                    defaultValue={[field.value || 200]}
                                                    onValueChange={(value) => field.onChange(value[0])}
                                                    min={50}
                                                    max={1000}
                                                    step={50}
                                                />
                                            </FormControl>
                                            <span className="w-20 text-center font-mono p-2 rounded-md border bg-muted">{field.value}m</span>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </CardContent>
                    </Card>
                )}
                
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Paso 2: Asignación de Guardias</CardTitle>
                            <CardDescription>Asigna los guardias que prestarán servicio en este condominio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="guardIds" render={() => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Shield /> Guardias Asignados</FormLabel>
                                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                                        <div className="space-y-2">
                                            {guards.map((guard) => (
                                                <FormField key={guard.id} control={form.control} name="guardIds" render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(guard.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...(field.value || []), guard.id])
                                                                        : field.onChange(field.value?.filter(v => v !== guard.id));
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">{guard.name}</FormLabel>
                                                    </FormItem>
                                                )}/>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </FormItem>
                            )}/>
                        </CardContent>
                    </Card>
                )}

                {step === 3 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Paso 3: Módulos para Guardias</CardTitle>
                            <CardDescription>Selecciona las secciones del menú que estarán disponibles para los guardias de este condominio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <FormField
                                control={form.control}
                                name="guardMenuSections"
                                render={() => (
                                    <FormItem>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                            {guardMenuOptions.map((item) => (
                                                <FormField
                                                    key={item.id}
                                                    control={form.control}
                                                    name="guardMenuSections"
                                                    render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                        key={item.id}
                                                        className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3"
                                                        >
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item.id)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                    ? field.onChange([...(field.value || []), item.id])
                                                                    : field.onChange(field.value?.filter((value) => value !== item.id))
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-normal flex items-center gap-2">
                                                            {item.icon} {item.label}
                                                        </FormLabel>
                                                        </FormItem>
                                                    )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                <div className="flex justify-end gap-2">
                    {step > 1 && (
                        <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={isPending}>Anterior</Button>
                    )}
                     {step < 3 && (
                        <Button type="button" onClick={() => setStep(step + 1)}>Siguiente</Button>
                    )}
                    {step === 3 && (
                         <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                            {initialData ? 'Guardar Cambios' : 'Crear Condominio'}
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
}
