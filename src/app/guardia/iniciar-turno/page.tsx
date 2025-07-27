

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Building, Loader2, CheckSquare, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Condominio, User, TurnoInfo, HandoverNote } from '@/lib/definitions';
import { startShift } from '@/lib/shiftService';
import { Checkbox } from '@/components/ui/checkbox';
import { getLatestHandoverNote } from '@/lib/handoverService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getCondominios } from '@/lib/condominioService';
import { getDistanceInMeters } from '@/lib/utils';
import { getList } from '@/lib/listService';
import Image from 'next/image';

const turnos = ['Diurno', 'Nocturno', 'Apoyo'] as const;

const formSchema = z.object({
  turno: z.enum(turnos, { required_error: "Debe seleccionar un turno." }),
  condominioId: z.string({ required_error: "Debe seleccionar un condominio." }).min(1, "Debe seleccionar un condominio."),
  equipmentIds: z.array(z.string()).refine(value => value.length > 0, {
    message: "Debe confirmar la recepción del equipo.",
  }),
});

// --- Time Validation Logic ---
const DIURNO_START_HOUR = 8;
const NOCTURNO_START_HOUR = 20;

function isTimeValidForShift(turno: (typeof turnos)[number]): boolean {
    const currentHour = new Date().getHours();
    
    if (turno === 'Diurno') {
        // Valid from 8:00 (8) to 19:59 (19)
        return currentHour >= DIURNO_START_HOUR && currentHour < NOCTURNO_START_HOUR;
    }
    
    if (turno === 'Nocturno') {
        // Valid from 20:00 (20) to 7:59 (7)
        return currentHour >= NOCTURNO_START_HOUR || currentHour < DIURNO_START_HOUR;
    }
    
    // 'Apoyo' shift is always valid
    return true;
}

export default function IniciarTurnoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
  const [lastHandoverNote, setLastHandoverNote] = useState<HandoverNote | null>(null);
  const [isHandoverNoteDialogOpen, setIsHandoverNoteDialogOpen] = useState(false);
  const [isTimeAlertOpen, setIsTimeAlertOpen] = useState(false);
  const [formValuesToSubmit, setFormValuesToSubmit] = useState<z.infer<typeof formSchema> | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        equipmentIds: []
    }
  });

  const selectedCondominioId = form.watch('condominioId');

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'Guardia') {
            router.replace('/');
            return;
        }
        setUser(parsedUser);
    }
    const fetchData = async () => {
        const condos = await getCondominios();
        setCondominios(condos.filter(c => c.status === 'Activo'));
    }
    fetchData();
    setEquipmentList(getList('equipment'));
  }, [router]);

  useEffect(() => {
    if (selectedCondominioId) {
        const note = getLatestHandoverNote(selectedCondominioId);
        if (note && note.notes) { // Check if note and note.notes exist
            setLastHandoverNote(note);
            setIsHandoverNoteDialogOpen(true);
        } else {
            setLastHandoverNote(null);
        }
    }
  }, [selectedCondominioId]);
  
  const proceedWithSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    if (!user) {
        toast({ title: "Error", description: "No se pudo identificar al usuario.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const selectedCondo = condominios.find(c => c.id === values.condominioId);
    if (!selectedCondo) {
        toast({ title: "Error", description: "Condominio no válido.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    // Geofence check
    const requiresGeofenceCheck = !user.allowRemoteCheckIn && selectedCondo.geofenceRadius && selectedCondo.latitude && selectedCondo.longitude;
    
    if (requiresGeofenceCheck) {
        setIsVerifyingLocation(true);
        toast({ title: "Verificando Ubicación", description: "Por favor, espera un momento..." });

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });

            const distance = getDistanceInMeters(
                position.coords.latitude,
                position.coords.longitude,
                selectedCondo.latitude!,
                selectedCondo.longitude!
            );

            if (distance > selectedCondo.geofenceRadius!) {
                toast({
                    title: "Fuera de Rango",
                    description: `Debes estar dentro de los ${selectedCondo.geofenceRadius} metros del condominio para iniciar turno.`,
                    variant: "destructive",
                    duration: 7000,
                });
                setIsLoading(false);
                setIsVerifyingLocation(false);
                return;
            }
        } catch (error: any) {
            let description = "No se pudo obtener tu ubicación. Intenta de nuevo.";
            if (error.code === 1) { // PERMISSION_DENIED
                description = "Se requiere permiso de ubicación para iniciar turno. Por favor, habilítalo en tu navegador.";
            }
            toast({ title: "Error de Ubicación", description, variant: "destructive", duration: 7000 });
            setIsLoading(false);
            setIsVerifyingLocation(false);
            return;
        }
        setIsVerifyingLocation(false);
    }
    
    // Manage personal shift info
    const turnoInfo: TurnoInfo = {
        turno: values.turno,
        condominioId: values.condominioId,
        condominioName: selectedCondo.name,
        equipmentIds: values.equipmentIds
    };
    sessionStorage.setItem('turnoInfo', JSON.stringify(turnoInfo));
    
    // Create historical shift record
    const newShiftRecord = await startShift(user.id, user.name, turnoInfo);

    if (newShiftRecord) {
        sessionStorage.setItem('currentShiftId', newShiftRecord.id);
        toast({
            title: "Turno Iniciado",
            description: `Turno ${values.turno} iniciado en ${selectedCondo.name}.`,
        });
        router.push('/guardia');
    } else {
        toast({
            title: "Error al iniciar turno",
            description: `No se pudo guardar el registro del turno. Por favor, inténtelo de nuevo.`,
            variant: "destructive",
        });
        setIsLoading(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isTimeValidForShift(values.turno)) {
      proceedWithSubmit(values);
    } else {
      setFormValuesToSubmit(values);
      setIsTimeAlertOpen(true);
    }
  };

  return (
    <>
        <Card className="w-full max-w-lg mx-auto shadow-xl">
        <CardHeader>
            <CardTitle className="text-2xl font-bold">Iniciar Turno</CardTitle>
            <CardDescription>Seleccione su turno, condominio y confirme el equipo recibido.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="turno"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4" />Turno</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione su turno" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {turnos.map(turno => (
                                <SelectItem key={turno} value={turno}>{turno}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="condominioId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><Building className="h-4 w-4" />Condominio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione el condominio" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {condominios.map(condo => (
                                <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="equipmentIds"
                    render={() => (
                        <FormItem>
                        <div className="mb-4">
                            <FormLabel className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" />Equipo Recibido</FormLabel>
                            <FormDescription>
                            Marque todo el equipo que está recibiendo para su turno.
                            </FormDescription>
                        </div>
                        <div className="space-y-2">
                            {equipmentList.map((item) => (
                            <FormField
                                key={item}
                                control={form.control}
                                name="equipmentIds"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={item}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(item)}
                                        onCheckedChange={(checked) => {
                                            const updatedIds = field.value ? [...field.value] : [];
                                            if (checked) {
                                                updatedIds.push(item);
                                            } else {
                                                const index = updatedIds.indexOf(item);
                                                if (index > -1) {
                                                    updatedIds.splice(index, 1);
                                                }
                                            }
                                            field.onChange(updatedIds);
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {item}
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && !isVerifyingLocation && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Iniciando...</>}
                    {isVerifyingLocation && <><MapPin className="mr-2 h-4 w-4 animate-ping" />Verificando Ubicación...</>}
                    {!isLoading && "Comenzar a Trabajar"}
                </Button>
            </form>
            </Form>
        </CardContent>
        </Card>

        <Dialog open={isHandoverNoteDialogOpen && !!lastHandoverNote} onOpenChange={setIsHandoverNoteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Notas del Turno Anterior</DialogTitle>
                    <DialogDescription>
                        El guardia {lastHandoverNote?.authorName} dejó las siguientes notas:
                    </DialogDescription>
                </DialogHeader>
                <div className="my-4 p-4 bg-muted rounded-md border text-sm">
                    {lastHandoverNote?.notes}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button>Entendido</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

         <AlertDialog open={isTimeAlertOpen} onOpenChange={setIsTimeAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar Turno Fuera de Horario?</AlertDialogTitle>
                    <AlertDialogDescription>
                        La hora actual está fuera del rango normal para el turno <strong>{formValuesToSubmit?.turno}</strong>. ¿Estás seguro de que quieres iniciar este turno?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setFormValuesToSubmit(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                        if (formValuesToSubmit) {
                            proceedWithSubmit(formValuesToSubmit);
                        }
                    }}>
                        Sí, iniciar turno
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
