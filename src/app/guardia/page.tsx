
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Car, ShieldCheck, FilePlus, BookText, Edit, Camera, X, CheckCircle, Package, QrCode, AlertTriangle, BellRing, UserCheck as UserCheckIcon, MessageSquare, Building2, LogOut, Loader2, Phone, Plus, ArrowLeft, RefreshCw, MapPin, BrainCircuit, Wallet, History as HistoryIcon, Send, XCircle, LogOutIcon, CalendarClock, Home, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleForm } from '@/components/vehicle-form';
import { PedestrianForm } from '@/components/pedestrian-form';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import type { User as UserType, TurnoInfo, BitacoraEntry, Address, VehicularRegistration, PedestrianRegistration, EmergencyContact, Package as PackageType, VisitorNotification, AlertResponse, Peticion, ArchivedPayroll, ShiftRecord, Loan, ResidentAccount, VehicleInfo, Reservation } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PeticionForm from '@/components/peticion-form';
import { addBitacoraEntry, getBitacora, updateBitacoraEntry } from '@/lib/bitacoraService';
import { addVehicularRegistration, addPedestrianRegistration, getVehicularRegistrations, getPedestrianRegistrations, updateVehicularExit, updatePedestrianExit } from '@/lib/registrationService';
import BitacoraTimeline from '@/components/bitacora-timeline';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import QrScanner from '@/components/qr-scanner';
import { getGuestPassById } from '@/lib/guestPassService';
import { getPackages, updatePackage, getPackageById } from '@/lib/packageService';
import { PackageForm } from '@/components/package-form';
import { getVisitorNotifications, updateVisitorNotification } from '@/lib/visitorNotificationService';
import { formatDistanceToNow, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { PackageDeliveryDialog } from '@/components/package-delivery-dialog';
import { AlertResponseDialog } from '@/components/alert-response-dialog';
import { addAlertResponse } from '@/lib/alertResponseService';
import { addPeticion, getPeticiones, updatePeticion as updatePeticionService } from '@/lib/peticionService';
import PeticionDetails from "@/components/peticion-details";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getUserById, getUsers } from '@/lib/userService';
import { getArchivedPayrolls, getLoans, requestLoan } from '@/lib/payrollService';
import { getShiftRecords } from '@/lib/shiftService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PayrollReceipt } from '@/components/admin/payroll-receipt';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeBinnacle, type AnalyzeBinnacleOutput } from '@/ai/flows/analyze-binnacle-flow';
import { getResidentAccounts } from '@/lib/feeService';
import { getUserVehicles } from '@/lib/vehicleService';
import { getReservations } from '@/lib/reservationService';
import { playSound } from '@/lib/soundService';
import { getList } from '@/lib/listService';
import { CameraCaptureDialog } from '@/components/camera-capture-dialog';
import { getDomicilios } from '@/lib/domicilioService';


const vehicleFormSchema = z.object({
  licensePlate: z.string(),
  fullName: z.string(),
  visitorType: z.string(),
  vehicleType: z.string(),
  vehicleBrand: z.string(),
  vehicleColor: z.string(),
  address: z.string(),
});

const pedestrianFormSchema = z.object({
  fullName: z.string(),
  visitorType: z.string(),
  address: z.string(),
});

const loanRequestSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  reason: z.string().min(10, "La razón debe tener al menos 10 caracteres."),
});

// #region GUARDIA PAGE

type PendingRegistration = {
    passId?: string;
    notificationId?: string;
    fullName: string;
    address: string;
    visitorType: string;
    licensePlate?: string;
    vehicleType?: string;
    vehicleBrand?: string;
    vehicleColor?: string;
    visitorIdPhotoUrl?: string;
    vehiclePhotoUrl?: string;
    residentStatus?: 'moroso' | 'al_corriente' | null;
} | null;

type ActiveView = 'dashboard' | 'vehicular' | 'pedestrian' | 'packages' | 'bitacora' | 'peticiones' | 'my_payroll' | 'my_loans' | 'active_exits' | 'reservations' | 'notifications';
type ScannerMode = 'vehicle' | 'pedestrian' | 'package' | 'resident' | null;

// #endregion

// #region SUB-COMPONENTS - Moved outside GuardiaPage for performance and correctness
function ActiveExitsView({ vehicular, pedestrian, onVehicleExit, onPedestrianExit }: { vehicular: VehicularRegistration[], pedestrian: PedestrianRegistration[], onVehicleExit: (id: string) => void, onPedestrianExit: (id: string) => void }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Vehículos Activos ({vehicular.length})</CardTitle>
                    <CardDescription>Vehículos que se encuentran actualmente dentro del condominio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {vehicular.length > 0 ? vehicular.map(reg => (
                        <div key={reg.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                                <p className="font-semibold">{reg.fullName} - <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{reg.licensePlate}</span></p>
                                <p className="text-sm text-muted-foreground">Entrada: {formatDistanceToNow(new Date(reg.entryTimestamp), { addSuffix: true, locale: es })}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => onVehicleExit(reg.id)}>Salida</Button>
                        </div>
                    )) : <p className="text-center text-muted-foreground py-8">No hay vehículos activos.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Peatones Activos ({pedestrian.length})</CardTitle>
                    <CardDescription>Personas que han ingresado a pie y no han salido.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                    {pedestrian.length > 0 ? pedestrian.map(reg => (
                         <div key={reg.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                                <p className="font-semibold">{reg.fullName}</p>
                                <p className="text-sm text-muted-foreground">Entrada: {formatDistanceToNow(new Date(reg.entryTimestamp), { addSuffix: true, locale: es })}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => onPedestrianExit(reg.id)}>Salida</Button>
                        </div>
                    )) : <p className="text-center text-muted-foreground py-8">No hay peatones activos.</p>}
                </CardContent>
            </Card>
        </div>
    )
}

function ReservationsView({ reservations }: { reservations: Reservation[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Reservaciones para Hoy</CardTitle>
                <CardDescription>Estas son las áreas comunes que estarán en uso durante tu turno.</CardDescription>
            </CardHeader>
            <CardContent>
                {reservations.length > 0 ? (
                    <ul className="space-y-4">
                        {reservations.map(res => (
                             <li key={res.id} className="p-4 border rounded-md">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-lg">{res.areaName}</p>
                                    <Badge variant={res.status === 'Aprobada' ? 'default' : 'secondary'}>{res.status}</Badge>
                                </div>
                                <p><strong>Residente:</strong> {res.userName}</p>
                                <p><strong>Horario:</strong> {res.startTime} - {res.endTime}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-10">No hay reservaciones para el día de hoy.</p>
                )}
            </CardContent>
        </Card>
    )
}

function RegistrationTypeDialog({ resident, onClose, onSelect }: { resident: UserType, onClose: () => void, onSelect: (type: 'pedestrian' | 'vehicular') => void }) {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Visita de Residente</DialogTitle>
                <DialogDescription>
                    ¿Cómo deseas registrar a {resident.name}?
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-24 text-lg" onClick={() => onSelect('pedestrian')}>
                    <User className="mr-4 h-8 w-8" /> Peatonal
                </Button>
                 <Button variant="outline" className="h-24 text-lg" onClick={() => onSelect('vehicular')}>
                    <Car className="mr-4 h-8 w-8" /> Vehicular
                </Button>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </DialogFooter>
        </DialogContent>
    )
}

function VehicleSelectionDialog({ vehicles, onClose, onSelect }: { vehicles: VehicleInfo[], onClose: () => void, onSelect: (vehicle: VehicleInfo) => void }) {
    return (
         <DialogContent>
            <DialogHeader>
                <DialogTitle>Seleccionar Vehículo</DialogTitle>
                <DialogDescription>
                    Elige el vehículo que utilizará el residente para su entrada.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 max-h-64 overflow-y-auto">
                {vehicles.map(v => (
                    <Card key={v.id} className="hover:bg-muted cursor-pointer" onClick={() => onSelect(v)}>
                        <CardContent className="p-3">
                            <p className="font-semibold">{v.alias || v.licensePlate}</p>
                            <p className="text-sm text-muted-foreground">{v.brand} {v.type} - {v.color}</p>
                            <p className="text-sm font-mono">{v.licensePlate}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            </DialogFooter>
        </DialogContent>
    )
}


function MyLoansView({ user, loans, onLoanRequested }: { user: UserType, loans: Loan[], onLoanRequested: () => void }) {
    const [isLoanRequestOpen, setIsLoanRequestOpen] = useState(false);
    const hasActiveLoan = loans.some(l => l.status === 'Pendiente' || l.status === 'Aprobado');

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                    <CardTitle>Historial y Solicitud de Préstamos</CardTitle>
                    <CardDescription>Consulta tus préstamos y solicita nuevos.</CardDescription>
                </div>
                <Button onClick={() => setIsLoanRequestOpen(true)} disabled={hasActiveLoan || !user.loanLimit || user.loanLimit === 0} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" /> Solicitar Préstamo
                </Button>
            </CardHeader>
            <CardContent>
                {hasActiveLoan && (
                    <Alert variant="warning" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Préstamo Activo</AlertTitle>
                        <AlertDescription>
                            Ya tienes un préstamo activo o pendiente. Debes liquidarlo antes de solicitar uno nuevo.
                        </AlertDescription>
                    </Alert>
                )}
                 <div className="overflow-x-auto">
                    {loans.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Monto Solicitado</TableHead>
                                    <TableHead>Saldo Pendiente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loans.map(loan => (
                                    <TableRow key={loan.id}>
                                        <TableCell>${(loan.amount).toFixed(2)}</TableCell>
                                        <TableCell className="font-semibold">${(loan.balance).toFixed(2)}</TableCell>
                                        <TableCell>{format(new Date(loan.requestedAt), "PPP", { locale: es })}</TableCell>
                                        <TableCell><Badge variant={loan.status === 'Aprobado' ? 'default' : (loan.status === 'Pagado' ? 'secondary' : 'outline')}>{loan.status}</Badge></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No tienes un historial de préstamos.</p>
                    )}
                 </div>
            </CardContent>
            <Dialog open={isLoanRequestOpen} onOpenChange={setIsLoanRequestOpen}>
                <LoanRequestDialog user={user} onClose={() => setIsLoanRequestOpen(false)} onRequested={onLoanRequested} />
            </Dialog>
        </Card>
    );
}

function LoanRequestDialog({ user, onClose, onRequested }: { user: UserType, onClose: () => void, onRequested: () => void }) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof loanRequestSchema>>({
        resolver: zodResolver(loanRequestSchema),
        defaultValues: { amount: undefined, reason: "" },
    });

    const onSubmit = (values: z.infer<typeof loanRequestSchema>) => {
        if (values.amount > (user.loanLimit || 0)) {
            toast({ variant: 'destructive', title: 'Límite Excedido', description: `No puedes solicitar más de $${(user.loanLimit || 0).toFixed(2)}.`});
            return;
        }
        requestLoan({
            guardId: user.id,
            guardName: user.name,
            amount: values.amount,
            reason: values.reason,
            interestRate: user.interestRate || 0,
        });
        toast({ title: 'Solicitud Enviada', description: 'Tu solicitud de préstamo ha sido enviada a administración.'});
        onRequested();
        onClose();
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Solicitar Préstamo o Adelanto</DialogTitle>
                <DialogDescription>
                    Tu límite de préstamo es de <strong>${(user.loanLimit || 0).toFixed(2)}</strong>. La solicitud será revisada por un administrador.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <FormField control={form.control} name="amount" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Monto a Solicitar ($)</FormLabel>
                            <FormControl><Input type="number" placeholder="500.00" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="reason" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Motivo de la Solicitud</FormLabel>
                            <FormControl><Textarea placeholder="Ej: Emergencia médica familiar..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit">Enviar Solicitud</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    )
}

function MyPayrollView({ user, payrolls, shifts }: { user: UserType, payrolls: ArchivedPayroll[], shifts: ShiftRecord[] }) {
    const userPayrolls = payrolls.map(p => ({
        ...p,
        payrollData: p.payrollData.find(pd => pd.guardId === user.id)
    })).filter(p => p.payrollData);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Nóminas</CardTitle>
                        <CardDescription>Consulta tus recibos de pago anteriores.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {userPayrolls.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {userPayrolls.map(archive => archive.payrollData && (
                                    <AccordionItem key={archive.id} value={archive.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between w-full pr-4">
                                                <span>Periodo: {format(new Date(archive.period.from), "d MMM")} - {format(new Date(archive.period.to), "d MMM yyyy")}</span>
                                                <span className="font-bold">Neto: ${(archive.payrollData.total).toFixed(2)}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <PayrollReceipt details={archive.payrollData} period={{ from: new Date(archive.period.from), to: new Date(archive.period.to) }} />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No hay nóminas archivadas para mostrar.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Mis Turnos Recientes</CardTitle>
                        <CardDescription>Últimos 10 turnos registrados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {shifts.slice(0, 10).map(shift => (
                                <li key={shift.id} className="text-sm p-2 bg-muted/50 rounded-md">
                                    <p className="font-semibold">{format(new Date(shift.startTime), "PPP", { locale: es })}</p>
                                    <p className="text-xs text-muted-foreground">{shift.condominioName} - Turno {shift.turno}</p>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function IncidentReportDialog({ user, turnoInfo, onClose, onUpdate }: { user: UserType, turnoInfo: TurnoInfo, onClose: () => void, onUpdate: () => void }) {
    const { toast } = useToast();
    const [incidentCategories, setIncidentCategories] = useState<string[]>([]);
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [location, setLocation] = useState<{ lat: number, lon: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    // AI State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<AnalyzeBinnacleOutput | null>(null);

    useEffect(() => {
        setIncidentCategories(getList('incidentCategories'));
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: 'destructive', title: 'Geolocalización no soportada'});
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                toast({ title: 'Ubicación añadida' });
            },
            () => toast({ variant: 'destructive', title: 'No se pudo obtener la ubicación'})
        );
    };

    const handleAnalyze = async () => {
        if (!description.trim()) {
            toast({ variant: 'destructive', title: 'Falta descripción', description: 'Escribe el reporte antes de analizarlo.'});
            return;
        }
        setIsAnalyzing(true);
        setAiSuggestion(null);
        try {
            const result = await analyzeBinnacle({ report: description });
            setAiSuggestion(result);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error de IA', description: 'No se pudo completar el análisis.'});
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    const handleCreateSuggestedPetition = async () => {
        if (!aiSuggestion || aiSuggestion.suggestedAction !== 'create_peticion' || !aiSuggestion.petitionTitle || !aiSuggestion.petitionDescription) return;

        await addPeticion({
            title: aiSuggestion.petitionTitle,
            description: aiSuggestion.petitionDescription,
            creatorId: user.id,
            creatorName: user.name,
            creatorRole: user.role,
            condominioId: turnoInfo.condominioId,
            condominioName: turnoInfo.condominioName
        });
        toast({ title: "Petición Creada", description: "La petición sugerida por la IA ha sido creada." });
        setAiSuggestion(null); // Clear suggestion after creating
    };

    const handleSubmit = async () => {
        if (!category || !description.trim()) {
            toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Por favor, seleccione una categoría y escriba una descripción.'});
            return;
        }
        setIsSubmitting(true);
        
        await addBitacoraEntry({
            condominioId: turnoInfo.condominioId,
            authorId: user.id,
            authorName: user.name,
            type: 'Incidente Reportado',
            category: category,
            text: description,
            photos: photos,
            latitude: location?.lat,
            longitude: location?.lon,
        });

        toast({ title: 'Incidente Reportado', description: 'La novedad ha sido añadida a la bitácora.'});
        onUpdate();
        onClose();
        setIsSubmitting(false);
    };

    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Reportar Nuevo Incidente</DialogTitle>
                <DialogDescription>Use este formulario para reportar eventos específicos. Quedará registrado en la bitácora.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="space-y-2">
                    <Label>Categoría del Incidente</Label>
                    <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger>
                        <SelectContent>{incidentCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Descripción detallada</Label>
                    <Textarea placeholder="Describa qué sucedió, quiénes estuvieron involucrados, y la ubicación exacta..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
                </div>
                {/* AI Assistant */}
                <div className="space-y-2">
                     <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing || !description.trim()}>
                        <BrainCircuit className="mr-2 h-4 w-4" /> {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                    </Button>
                    {aiSuggestion && (
                        <Alert variant={aiSuggestion.suggestedAction === 'create_peticion' ? 'default' : 'destructive'}>
                            <AlertTitle>Sugerencia de IA</AlertTitle>
                            <AlertDescription>
                                {aiSuggestion.suggestedAction === 'create_peticion' ? 
                                    `Se recomienda crear una petición con el título: "${aiSuggestion.petitionTitle}".` 
                                    : 'No se recomienda ninguna acción para este reporte.'}
                            </AlertDescription>
                            {aiSuggestion.suggestedAction === 'create_peticion' && (
                                <Button size="sm" className="mt-2" onClick={handleCreateSuggestedPetition}>Crear Petición Sugerida</Button>
                            )}
                        </Alert>
                    )}
                </div>

                <div className="space-y-2">
                    <Label>Evidencia (Opcional)</Label>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsCameraOpen(true)}><Camera className="mr-2 h-4 w-4"/>Añadir Foto</Button>
                        <Button variant="outline" onClick={handleGetLocation}><MapPin className="mr-2 h-4 w-4"/>Añadir Ubicación</Button>
                    </div>
                    {location && <p className="text-xs text-muted-foreground">Ubicación GPS adjuntada.</p>}
                     {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <Image src={photo} alt={`Foto ${index + 1}`} fill sizes="100px" className="rounded-md object-cover" />
                                    <Button variant="destructive" size="icon" onClick={() => setPhotos(p => p.filter((_, i) => i !== index))} className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !category || !description.trim()}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Reportar
                </Button>
            </DialogFooter>
             <CameraCaptureDialog
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={(dataUrl) => setPhotos(prev => [...prev, dataUrl])}
                title="Añadir Foto"
                description="Tome una foto de evidencia para el incidente."
            />
        </DialogContent>
    )
}

function BitacoraEditDialog({ entry, onUpdate, onClose }: { entry: BitacoraEntry, onUpdate: () => void, onClose: () => void }) {
    const { toast } = useToast();
    const [text, setText] = useState(entry.text);
    const [photos, setPhotos] = useState<string[]>(entry.photos || []);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleCapture = (dataUrl: string) => {
        setPhotos(prev => [...prev, dataUrl]);
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveChanges = async () => {
        if (text.trim() === "" && photos.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "El reporte no puede estar vacío." });
            return;
        }
        await updateBitacoraEntry(entry.id, { text, photos });
        toast({ title: "Entrada actualizada", description: "Los cambios han sido guardados." });
        onUpdate();
        onClose();
    };

    return (
        <>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Novedad en Bitácora</DialogTitle>
                    <DialogDescription>Modifica el texto o las fotos del reporte. Los cambios quedarán registrados.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[120px]"
                    />
                     {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <Image src={photo} alt={`Foto ${index + 1}`} fill sizes="100px" className="rounded-md object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Eliminar foto</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" onClick={() => setIsCameraOpen(true)}>
                        <Camera className="mr-2 h-4 w-4" /> Añadir Foto
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}><Edit className="mr-2 h-4 w-4" />Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
            
            <CameraCaptureDialog
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                title="Añadir Foto"
                description="Tome una foto de evidencia para el incidente."
            />
        </>
    )
}

function DamageReportDialog({ pkg, onUpdate, onClose }: { pkg: PackageType, onUpdate: () => void, onClose: () => void }) {
    const { toast } = useToast();
    const [notes, setNotes] = useState(pkg.damageNotes || "");

    const handleSave = async () => {
        if(notes.trim() === "") {
            toast({ variant: "destructive", title: "Error", description: "Debe proveer una descripción del daño." });
            return;
        }
        await updatePackage(pkg.id, { status: 'Con Daño', damageNotes: notes });
        toast({ title: "Daño reportado", description: "El estado del paquete ha sido actualizado." });
        onUpdate();
        onClose();
    }

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reportar Daño en Paquete</DialogTitle>
                <DialogDescription>
                    Para: {pkg.recipientName} ({pkg.recipientAddress}). Describe el daño encontrado.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                 <Textarea 
                    placeholder="Ej: La caja está mojada en una esquina."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Reporte</Button>
            </DialogFooter>
        </DialogContent>
    );
}

// #endregion


export default function GuardiaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [turnoInfo, setTurnoInfo] = useState<TurnoInfo | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeout = 10 * 60 * 1000; // 10 minutes

  // Main page content state
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // Dialog states
  const [isPeticionFormOpen, setIsPeticionFormOpen] = useState(false);
  const [isIncidentReportOpen, setIsIncidentReportOpen] = useState(false);
  const [isLoanRequestOpen, setIsLoanRequestOpen] = useState(false);
  const [isEmergencyPanelOpen, setIsEmergencyPanelOpen] = useState(false);
  const [deliveringPackage, setDeliveringPackage] = useState<PackageType | null>(null);
  const [packageToReportDamage, setPackageToReportDamage] = useState<PackageType | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertStartTime, setAlertStartTime] = useState<number | null>(null);
  const [viewingPhotos, setViewingPhotos] = useState<VehicularRegistration | null>(null);
  const [scannerMode, setScannerMode] = useState<ScannerMode>(null);
  const [editingBitacoraEntry, setEditingBitacoraEntry] = useState<BitacoraEntry | null>(null);
  const [viewingPeticion, setViewingPeticion] = useState<Peticion | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [scannedResident, setScannedResident] = useState<UserType | null>(null);
  const [validationResult, setValidationResult] = useState<{ status: 'success' | 'warning' | 'error'; user?: UserType, account?: ResidentAccount | null } | null>(null);
  const [residentForRegistration, setResidentForRegistration] = useState<UserType | null>(null);
  const [isVehicleSelectionOpen, setIsVehicleSelectionOpen] = useState(false);
  const [vehiclesForSelection, setVehiclesForSelection] = useState<VehicleInfo[]>([]);

  
  // Data states
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [vehicleRegistrations, setVehicleRegistrations] = useState<VehicularRegistration[]>([]);
  const [pedestrianRegistrations, setPedestrianRegistrations] = useState<PedestrianRegistration[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
  const [bitacoraEntries, setBitacoraEntries] = useState<BitacoraEntry[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration>(null);
  const [archivedPayrolls, setArchivedPayrolls] = useState<ArchivedPayroll[]>([]);
  const [shiftRecords, setShiftRecords] = useState<ShiftRecord[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  
  const scheduleNextAlert = useCallback(() => {
    if (turnoInfo?.turno !== 'Nocturno' || isAlertOpen) return;
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    
    alertTimeoutRef.current = setTimeout(() => {
      const storedTurno = sessionStorage.getItem('turnoInfo');
      if (storedTurno && JSON.parse(storedTurno).turno === 'Nocturno') {
        setAlertStartTime(Date.now());
        setIsAlertOpen(true);
      }
    }, idleTimeout);
  }, [turnoInfo, idleTimeout, isAlertOpen]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
      const parsedUser: UserType = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role === 'Guardia') {
        const storedTurno = sessionStorage.getItem('turnoInfo');
        if (storedTurno) {
          const turno: TurnoInfo = JSON.parse(storedTurno);
          setTurnoInfo(turno);
        } else {
          router.replace('/guardia/iniciar-turno');
        }
      }
    }
  }, [router]);
  
  // Data fetching effect
  useEffect(() => {
    if (turnoInfo && user) {
        async function loadData() {
            setAllUsers(await getUsers());
            setAllAddresses(await getDomicilios(turnoInfo.condominioId));
            setPackages(await getPackages(turnoInfo.condominioId));
            setNotifications(getVisitorNotifications(turnoInfo.condominioId));
            setVehicleRegistrations(await getVehicularRegistrations(turnoInfo.condominioId));
            setPedestrianRegistrations(await getPedestrianRegistrations(turnoInfo.condominioId));
            setBitacoraEntries(await getBitacora(turnoInfo.condominioId));
            setPeticiones(await getPeticiones(turnoInfo.condominioId));
            setArchivedPayrolls(getArchivedPayrolls().filter(p => p.payrollData.some(pd => pd.guardId === user.id)));
            setShiftRecords(getShiftRecords().filter(s => s.guardId === user.id));
            setLoans(getLoans(user.id));
            setReservations(getReservations(turnoInfo.condominioId));
        }
        loadData();
    }
  }, [turnoInfo, user, refreshKey]);

  // Smart alert timer effect
  useEffect(() => {
    if (turnoInfo?.turno === 'Nocturno') {
      scheduleNextAlert();
      const handleUserActivity = () => scheduleNextAlert();
      const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'touchstart', 'keydown', 'scroll'];
      activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
      
      return () => {
        activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      };
    }
  }, [turnoInfo, scheduleNextAlert]);
  
  const availableAddresses = useMemo(() => {
      if (turnoInfo?.condominioId) {
          return allAddresses.filter(addr => addr.condominioId === turnoInfo.condominioId);
      }
      return allAddresses;
  }, [turnoInfo, allAddresses]);

  const handleUpdate = () => setRefreshKey(prev => prev + 1);
  
  const handleUpdatePeticion = async (updatedPeticion: Peticion) => {
    await updatePeticionService(updatedPeticion.id, updatedPeticion);
    handleUpdate();
  };

  const handleVehicleSubmit = async (values: z.infer<typeof vehicleFormSchema>, photos: { visitorIdPhotoUrl?: string, vehiclePhotoUrl?: string }) => {
    if (!turnoInfo || !user) return;
    
    await addVehicularRegistration({
      ...values,
      condominioId: turnoInfo.condominioId,
      condominioName: turnoInfo.condominioName,
      visitorIdPhotoUrl: photos.visitorIdPhotoUrl,
      vehiclePhotoUrl: photos.vehiclePhotoUrl,
    });
    
    await addBitacoraEntry({
        condominioId: turnoInfo.condominioId,
        authorId: user.id,
        authorName: user.name,
        type: 'Registro Vehicular',
        text: `Entrada de ${values.fullName} con vehículo placas ${values.licensePlate} al domicilio ${values.address}. Se tomaron fotos de ID y vehículo.`
    });
    
    if (pendingRegistration?.notificationId) {
        updateVisitorNotification(pendingRegistration.notificationId, { status: 'Utilizada' });
    }
    
    handleUpdate();
    setPendingRegistration(null);
    playSound('success');
    toast({ title: "Registro Exitoso", description: `Entrada de ${values.fullName} registrada.` });
  };

  const handlePedestrianSubmit = async (values: z.infer<typeof pedestrianFormSchema>, photos: { visitorIdPhotoUrl?: string }) => {
     if (!turnoInfo || !user) return;
    
    await addPedestrianRegistration({
      ...values,
      condominioId: turnoInfo.condominioId,
      condominioName: turnoInfo.condominioName,
      visitorIdPhotoUrl: photos.visitorIdPhotoUrl,
    });

    await addBitacoraEntry({
        condominioId: turnoInfo.condominioId,
        authorId: user.id,
        authorName: user.name,
        type: 'Registro Peatonal',
        text: `Entrada peatonal de ${values.fullName} al domicilio ${values.address}. Se usó foto de pase QR.`
    });

    if (pendingRegistration?.notificationId) {
      updateVisitorNotification(pendingRegistration.notificationId, { status: 'Utilizada' });
    }

    handleUpdate();
    setPendingRegistration(null);
    playSound('success');
    toast({ title: "Registro Exitoso", description: `La entrada de ${values.fullName} ha sido registrada.` });
  };
  
  const handleVehicleExit = async (id: string) => {
    await updateVehicularExit(id);
    handleUpdate();
    playSound('click');
    toast({ title: "Salida Registrada", description: "La salida del vehículo ha sido registrada." });
  };

  const handlePedestrianExit = async (id: string) => {
    await updatePedestrianExit(id);
    handleUpdate();
    playSound('click');
    toast({ title: "Salida Registrada", description: "La salida del peatón ha sido registrada." });
  };

  const handleCreatePeticion = async (values: { title: string; description: string; }) => {
      if (!user || !turnoInfo) {
          toast({ title: "Error", description: "No se puede crear la petición. Falta información de usuario o turno.", variant: "destructive" });
          return;
      }
      const newPeticion = await addPeticion({ ...values, creatorId: user.id, creatorName: user.name, creatorRole: user.role, condominioId: turnoInfo.condominioId, condominioName: turnoInfo.condominioName });
      if (newPeticion) {
        await addBitacoraEntry({ condominioId: turnoInfo.condominioId, authorId: user.id, authorName: user.name, type: 'Petición Creada', text: `Creó petición: "${values.title}"`, relatedId: newPeticion.id });
        toast({ title: "Petición Creada", description: "Tu petición ha sido enviada y registrada en la bitácora." });
        setIsPeticionFormOpen(false);
        handleUpdate();
      }
  }

  const handleQrScan = async (data: string) => {
    setScannerMode(null);
    if (data.startsWith('pkg:')) {
        const pkgId = data.substring(4);
        const pkg = await getPackageById(pkgId);
        if (!pkg) return toast({ title: "Paquete no encontrado", variant: "destructive" });
        if (pkg.status === 'Entregado') return toast({ title: "Paquete ya entregado", variant: "destructive" });
        toast({ title: "Paquete encontrado", description: `Iniciando entrega para ${pkg.recipientName}.` });
        setDeliveringPackage(pkg);
        return;
    }
    if (data.startsWith('user:')) {
        const userId = data.split(':')[1];
        const resident = await getUserById(userId);
        if (resident && (resident.role === 'Propietario' || resident.role === 'Renta')) {
            setScannedResident(resident);
        } else {
            toast({ title: "Residente no encontrado", description: "El código QR no corresponde a un propietario o inquilino válido.", variant: "destructive" });
        }
        return;
    }

    const pass = getGuestPassById(data);
    if (!pass) return toast({ title: "Pase Inválido", description: "El pase no existe o ha expirado.", variant: "destructive" });

    setPendingRegistration({
        passId: pass.id,
        fullName: pass.guestName,
        address: pass.address,
        visitorType: pass.visitorType,
        visitorIdPhotoUrl: pass.visitorIdPhotoUrl,
        vehiclePhotoUrl: pass.vehiclePhotoUrl,
        residentStatus: null, // Status is unknown for guest passes
        ...(pass.accessType === 'vehicular' && {
            licensePlate: pass.licensePlate,
            vehicleType: pass.vehicleType,
            vehicleBrand: pass.vehicleBrand,
            vehicleColor: pass.vehicleColor,
        })
    });
    toast({ title: "Pase Válido", description: `Cargando datos de ${pass.guestName}.` });
    setActiveView(pass.accessType);
  };
  
  const handleConfirmDelivery = async (packageId: string, photoUrl: string, signatureUrl: string, deliveredToName: string) => {
    await updatePackage(packageId, { status: 'Entregado', deliveryPhotoUrl: photoUrl, deliverySignatureUrl: signatureUrl, deliveredToName: deliveredToName });
    
    setDeliveringPackage(null); // Close the dialog
    setShowSuccessOverlay(true); // Show success message
    playSound('success');
    
    setTimeout(() => {
        setShowSuccessOverlay(false);
    }, 3000); // Hide after 3 seconds

    handleUpdate(); // Refresh package list
  };

  const handleValidateResident = async (userId: string) => {
    setScannedResident(null); // Close the options dialog
    const user = await getUserById(userId);
    if (!user) {
        setValidationResult({ status: 'error' });
        setTimeout(() => setValidationResult(null), 4000);
        return;
    }

    const account = getResidentAccounts().find(acc => acc.residentId === userId);
    const isMoroso = account ? account.balance > 0 : false;

    if (isMoroso) {
        setValidationResult({ status: 'warning', user, account: account || null });
    } else {
        setValidationResult({ status: 'success', user, account: account || null });
    }

    setTimeout(() => setValidationResult(null), 5000);
  };
  
  const handleAlertResponse = async (data: Omit<AlertResponse, 'id' | 'guardId' | 'guardName' | 'condominioId' | 'createdAt'>) => {
    if (!user || !turnoInfo) return;

    await addAlertResponse({ ...data, guardId: user.id, guardName: user.name, condominioId: turnoInfo.condominioId });
    await addBitacoraEntry({
        condominioId: turnoInfo.condominioId, authorId: user.id, authorName: user.name, type: 'Alerta Respondida',
        text: `Respondió a la alerta de prueba de vida en ${data.responseTimeSeconds} segundos. Comentario: "${data.comment}"`,
        photos: [data.selfiePhotoUrl, data.environmentPhotoUrl]
    });

    toast({ title: "Respuesta Registrada", description: "La prueba de vida ha sido completada." });
    setIsAlertOpen(false);
    setAlertStartTime(null);
    scheduleNextAlert();
    handleUpdate();
  };

  const handleSelectRegistrationType = async (type: 'pedestrian' | 'vehicular') => {
    if (!residentForRegistration) return;

    const account = getResidentAccounts().find(acc => acc.residentId === residentForRegistration.id);
    const residentStatus = account && account.balance > 0 ? 'moroso' : 'al_corriente';

    if (type === 'pedestrian') {
        const address = allAddresses.find(a => a.id === residentForRegistration.addressId);
        setPendingRegistration({
            fullName: residentForRegistration.name,
            address: address?.fullAddress || 'No especificado',
            visitorType: residentForRegistration.role,
            visitorIdPhotoUrl: residentForRegistration.photoUrl,
            residentStatus: residentStatus
        });
        setActiveView('pedestrian');
        setResidentForRegistration(null);
    } else { // vehicular
        const vehicles = getUserVehicles(residentForRegistration.id);
        if (vehicles.length === 0) {
            toast({ title: "Sin Vehículos", description: "Este residente no tiene vehículos registrados.", variant: "destructive"});
            return;
        }
        setVehiclesForSelection(vehicles);
        setIsVehicleSelectionOpen(true);
    }
  };

  const handleSelectVehicleForResident = (vehicle: VehicleInfo) => {
    if (!residentForRegistration) return;
     const account = getResidentAccounts().find(acc => acc.residentId === residentForRegistration.id);
    const residentStatus = account && account.balance > 0 ? 'moroso' : 'al_corriente';
    const address = allAddresses.find(a => a.id === residentForRegistration.addressId);

    setPendingRegistration({
        fullName: residentForRegistration.name,
        address: address?.fullAddress || 'No especificado',
        visitorType: residentForRegistration.role,
        visitorIdPhotoUrl: residentForRegistration.photoUrl,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.type,
        vehicleBrand: vehicle.brand,
        vehicleColor: vehicle.color,
        residentStatus: residentStatus
    });

    setActiveView('vehicular');
    setIsVehicleSelectionOpen(false);
    setResidentForRegistration(null);
  };

  const isGuard = user?.role === 'Guardia';
  if (!isGuard || !turnoInfo || !user) {
      return (
          <div className="flex flex-col min-h-screen p-4 items-center justify-center">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
      );
  }

  // Derived state for badges and lists
  const activeVehicles = vehicleRegistrations.filter(r => !r.exitTimestamp);
  const activePedestrians = pedestrianRegistrations.filter(r => !r.exitTimestamp);
  const packagesPendientes = packages.filter(p => p.status !== 'Entregado');
  const activeNotifications = notifications.filter(n => n.status === 'Activa');
  const todayReservations = reservations.filter(r => isToday(new Date(r.date)));


  const mainActions = [
      { name: 'Registro Vehicular', icon: Car, view: 'vehicular' as ActiveView },
      { name: 'Registro Peatonal', icon: User, view: 'pedestrian' as ActiveView },
      { name: 'Notificaciones Activas', icon: Bell, view: 'notifications' as ActiveView, count: activeNotifications.length },
      { name: 'Salidas Activas', icon: LogOutIcon, view: 'active_exits' as ActiveView, count: activeVehicles.length + activePedestrians.length },
      { name: 'Paquetería', icon: Package, view: 'packages' as ActiveView, count: packagesPendientes.length },
      { name: 'Escanear Residente', icon: QrCode, action: () => setScannerMode('resident') },
      { name: 'Reservaciones de Hoy', icon: CalendarClock, view: 'reservations' as ActiveView, count: todayReservations.length },
      { name: 'Bitácora / Incidentes', icon: BookText, view: 'bitacora' as ActiveView },
      { name: 'Nómina y Asistencia', icon: HistoryIcon, view: 'my_payroll' as ActiveView },
      { name: 'Préstamos', icon: Wallet, view: 'my_loans' as ActiveView },
      { name: 'Peticiones', icon: MessageSquare, view: 'peticiones' as ActiveView },
      { name: 'Emergencia', icon: Phone, action: () => setIsEmergencyPanelOpen(true) },
  ];
  
  const renderView = () => {
      const TaskView = ({title, children}: {title: string, children: React.ReactNode}) => (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setActiveView('dashboard')}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold">{title}</h2>
          </div>
          {children}
        </div>
      );

      switch(activeView) {
          case 'notifications':
              return <TaskView title="Notificaciones de Visita">
                  <Card>
                      <CardHeader>
                          <CardTitle>Notificaciones Activas</CardTitle>
                          <CardDescription>Estas son las notificaciones de visitas futuras que han creado los residentes.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {activeNotifications.length > 0 ? (
                              <ul className="space-y-3">
                                  {activeNotifications.map(n => (
                                      <li key={n.id} className="p-3 border rounded-md">
                                          <p className="font-semibold">Visitante: {n.who} ({n.visitorType})</p>
                                          <p className="text-sm">Asunto: {n.subject}</p>
                                          <p className="text-sm text-muted-foreground">Para Residente: {n.residentName} ({n.address})</p>
                                          <p className="text-xs text-muted-foreground mt-1">Recibido {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}</p>
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-center text-muted-foreground py-10">No hay notificaciones activas en este momento.</p>
                          )}
                      </CardContent>
                  </Card>
              </TaskView>
          case 'vehicular':
              return <TaskView title="Registro Vehicular">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle>Entrada Vehicular</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setScannerMode('vehicle')}>
                                        <QrCode className="mr-2 h-4 w-4" /> Escanear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <VehicleForm onSubmit={handleVehicleSubmit} availableAddresses={availableAddresses} pendingRegistration={pendingRegistration} pastRegistrations={vehicleRegistrations} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehículos Activos ({activeVehicles.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                                {activeVehicles.length > 0 ? activeVehicles.map((reg) => (
                                    <Card key={reg.id} className="w-full">
                                        <CardContent className="p-4 flex flex-col sm:flex-row items-start gap-4">
                                            <div className="flex-grow space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold">{reg.fullName}</h3>
                                                    <Badge variant="secondary" className="font-mono">{reg.licensePlate}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Visita a: {reg.address}</p>
                                                <p className="text-xs text-muted-foreground">Entrada: {new Date(reg.entryTimestamp).toLocaleString('es-MX')}</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                                                {reg.visitorIdPhotoUrl && <Button variant="ghost" size="icon" onClick={() => setViewingPhotos(reg)}><Camera className="h-4 w-4" /></Button>}
                                                <Button variant="outline" size="sm" onClick={() => handleVehicleExit(reg.id)}><LogOut className="mr-2 h-4 w-4" />Salida</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )) : <p className="text-muted-foreground text-center py-8">No hay vehículos activos.</p>}
                            </CardContent>
                        </Card>
                    </div>
                 </div>
              </TaskView>
          case 'pedestrian':
              return <TaskView title="Registro Peatonal">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                         <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle>Entrada Peatonal</CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setScannerMode('pedestrian')}>
                                        <QrCode className="mr-2 h-4 w-4" /> Escanear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <PedestrianForm onSubmit={handlePedestrianSubmit} availableAddresses={availableAddresses} pendingRegistration={pendingRegistration} pastRegistrations={pedestrianRegistrations} />
                            </CardContent>
                        </Card>
                    </div>
                     <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Peatones Activos ({activePedestrians.length})</CardTitle></CardHeader>
                            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                                {activePedestrians.length > 0 ? activePedestrians.map((reg) => (
                                    <Card key={reg.id} className="w-full">
                                        <CardContent className="p-4 flex items-center justify-between gap-4">
                                            <div className="flex-grow space-y-1">
                                                <h3 className="font-semibold">{reg.fullName}</h3>
                                                <p className="text-sm text-muted-foreground">Visita a: {reg.address}</p>
                                                <p className="text-xs text-muted-foreground">Entrada: {new Date(reg.entryTimestamp).toLocaleString('es-MX')}</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handlePedestrianExit(reg.id)}><LogOut className="mr-2 h-4 w-4" />Salida</Button>
                                        </CardContent>
                                    </Card>
                                )) : <p className="text-muted-foreground text-center py-8">No hay peatones activos.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </TaskView>
          case 'packages':
              return <TaskView title="Gestión de Paquetería">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Registrar Paquete</CardTitle></CardHeader>
                            <CardContent><PackageForm user={user} turnoInfo={turnoInfo} addresses={availableAddresses} onUpdate={handleUpdate} /></CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Escanear para Entrega</CardTitle></CardHeader>
                            <CardContent><QrScanner onScan={handleQrScan} /></CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Paquetes Pendientes ({packagesPendientes.length})</CardTitle></CardHeader>
                            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                                {packagesPendientes.map((pkg) => (
                                    <Card key={pkg.id}>
                                        <CardContent className="p-3 flex justify-between items-start gap-2">
                                            <div className="flex-grow space-y-1">
                                                <p className="font-semibold">{pkg.recipientName}</p>
                                                <p className="text-sm text-muted-foreground">{pkg.recipientAddress}</p>
                                                 {pkg.status === 'Con Daño' && <Badge variant="destructive" className="mt-1">{pkg.status}</Badge>}
                                            </div>
                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                <Button size="sm" onClick={() => setDeliveringPackage(pkg)}>Entregar</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setPackageToReportDamage(pkg)}>Reportar Daño</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {packagesPendientes.length === 0 && <p className="text-center text-muted-foreground py-8">No hay paquetes pendientes.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </TaskView>
           case 'active_exits':
              return <TaskView title="Gestionar Salidas Activas"><ActiveExitsView vehicular={activeVehicles} pedestrian={activePedestrians} onVehicleExit={handleVehicleExit} onPedestrianExit={handlePedestrianExit} /></TaskView>
          case 'reservations':
              return <TaskView title="Reservaciones de Hoy"><ReservationsView reservations={todayReservations} /></TaskView>
          case 'bitacora':
              return <TaskView title="Bitácora de Novedades">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-3">
                         <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                <div>
                                    <CardTitle>Historial de Bitácora</CardTitle>
                                    <CardDescription>Eventos registrados durante el turno.</CardDescription>
                                </div>
                                <Button onClick={() => setIsIncidentReportOpen(true)} className="w-full sm:w-auto">
                                    <FilePlus className="mr-2 h-4 w-4" /> Reportar Incidente
                                </Button>
                            </CardHeader>
                            <CardContent className="max-h-[70vh] overflow-y-auto pr-2">
                                <BitacoraTimeline entries={bitacoraEntries} currentUser={user} onEdit={setEditingBitacoraEntry} />
                            </CardContent>
                        </Card>
                    </div>
                 </div>
              </TaskView>
          case 'peticiones':
              return <TaskView title="Peticiones y Alertas">
                  <Card>
                      <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-2">
                          <div>
                            <CardTitle>Peticiones de Residentes y Alertas</CardTitle>
                            <CardDescription>Revisa las solicitudes y alertas del condominio.</CardDescription>
                          </div>
                          <Button onClick={() => setIsPeticionFormOpen(true)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Crear Petición</Button>
                      </CardHeader>
                      <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                          {peticiones.length > 0 ? peticiones.map(p => (
                              <Card key={p.id} className={cn(p.category === 'Emergencia' && "border-destructive bg-destructive/10")}>
                                  <CardContent className="p-4 flex items-center justify-between gap-4">
                                      <div className="space-y-1">
                                          <Badge variant={p.status === 'Abierta' ? 'default' : 'secondary'}>{p.status}</Badge>
                                          <p className="font-bold">{p.title}</p>
                                          <p className="text-sm text-muted-foreground">{p.creatorName} ({p.creatorRole})</p>
                                          <p className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "PPP p", { locale: es })}</p>
                                      </div>
                                      <Button variant="outline" size="sm" onClick={() => setViewingPeticion(p)}>Ver Detalles</Button>
                                  </CardContent>
                              </Card>
                          )) : (
                              <p className="text-muted-foreground text-center py-8">No hay peticiones activas.</p>
                          )}
                      </CardContent>
                  </Card>
              </TaskView>
          case 'my_payroll':
              return <TaskView title="Nómina y Asistencia"><MyPayrollView user={user} payrolls={archivedPayrolls} shifts={shiftRecords} /></TaskView>
          case 'my_loans':
              return <TaskView title="Mis Préstamos"><MyLoansView user={user} loans={loans} onLoanRequested={handleUpdate} /></TaskView>
          case 'dashboard':
          default:
              return <div className="p-4">
                  <div className="mb-4">
                      <h2 className="text-2xl font-bold">Panel de Guardia</h2>
                      <p className="text-muted-foreground">Turno {turnoInfo.turno} en {turnoInfo.condominioName}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {mainActions.map(action => (
                          <Card key={action.name} className="hover:bg-muted/50 cursor-pointer transition-transform hover:-translate-y-1" onClick={() => action.view ? setActiveView(action.view) : action.action!()}>
                              <CardContent className="flex flex-col items-center justify-center p-6 gap-3 text-center relative">
                                  {action.count !== undefined && action.count > 0 && (
                                    <Badge className="absolute top-2 right-2">{action.count}</Badge>
                                  )}
                                  <action.icon className="w-8 h-8 text-primary" />
                                  <p className="font-semibold text-sm">{action.name}</p>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
      }
  };

  return (
    <div className="h-full w-full relative">
        <div className="h-full w-full overflow-y-auto">
            {renderView()}
        </div>
        
        {/* DIALOGS & MODALS */}
        <Dialog open={isPeticionFormOpen} onOpenChange={setIsPeticionFormOpen}>
            <DialogContent><PeticionForm onSubmit={handleCreatePeticion} onCancel={() => setIsPeticionFormOpen(false)} /></DialogContent>
        </Dialog>
        <Dialog open={isIncidentReportOpen} onOpenChange={setIsIncidentReportOpen}>
             <IncidentReportDialog user={user} turnoInfo={turnoInfo} onClose={() => setIsIncidentReportOpen(false)} onUpdate={handleUpdate} />
        </Dialog>
        <Dialog open={isEmergencyPanelOpen} onOpenChange={setIsEmergencyPanelOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Contactos de Emergencia</DialogTitle><DialogDescription>Números para contactar en caso de una emergencia en {turnoInfo.condominioName}.</DialogDescription></DialogHeader>
                <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {emergencyContacts.map(c => 
                    <Button key={c.id} asChild variant="outline" className="h-20 text-lg flex-col items-start p-4">
                        <a href={`tel:${c.phone}`}>
                            <span className="font-bold">{c.name}</span>
                            <span className="text-muted-foreground">{c.phone}</span>
                        </a>
                    </Button>
                  )}
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={!!packageToReportDamage} onOpenChange={(open) => !open && setPackageToReportDamage(null)}>
            {packageToReportDamage && <DamageReportDialog pkg={packageToReportDamage} onClose={() => setPackageToReportDamage(null)} onUpdate={handleUpdate} />}
        </Dialog>
        <Dialog open={!!deliveringPackage} onOpenChange={(open) => !open && setDeliveringPackage(null)}>
            {deliveringPackage && <PackageDeliveryDialog pkg={deliveringPackage} onClose={() => setDeliveringPackage(null)} onConfirm={handleConfirmDelivery} />}
        </Dialog>
        <Dialog open={!!editingBitacoraEntry} onOpenChange={(open) => !open && setEditingBitacoraEntry(null)}>
            {editingBitacoraEntry && <BitacoraEditDialog entry={editingBitacoraEntry} onUpdate={() => { handleUpdate(); setEditingBitacoraEntry(null); }} onClose={() => setEditingBitacoraEntry(null)} />}
        </Dialog>
        {user && alertStartTime && <AlertResponseDialog open={isAlertOpen} onResponse={handleAlertResponse} startTime={alertStartTime} />}
        <Dialog open={!!viewingPhotos} onOpenChange={(open) => !open && setViewingPhotos(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader><DialogTitle>Fotos del Registro Vehicular</DialogTitle><DialogDescription>Vehículo con placas {viewingPhotos?.licensePlate} registrado por {viewingPhotos?.fullName}.</DialogDescription></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2"><h4 className="font-medium text-center">Foto de Identificación</h4><div className="relative aspect-video w-full bg-muted rounded-md">{viewingPhotos?.visitorIdPhotoUrl ? <Image src={viewingPhotos.visitorIdPhotoUrl} alt="Foto de ID" layout="fill" className="object-contain"/> : <p className="text-center text-muted-foreground p-4">No disponible</p>}</div></div>
                    <div className="space-y-2"><h4 className="font-medium text-center">Foto del Vehículo</h4><div className="relative aspect-video w-full bg-muted rounded-md">{viewingPhotos?.vehiclePhotoUrl ? <Image src={viewingPhotos.vehiclePhotoUrl} alt="Foto del vehículo" layout="fill" className="object-contain"/> : <p className="text-center text-muted-foreground p-4">No disponible</p>}</div></div>
                </div>
            </DialogContent>
        </Dialog>
        <Dialog open={!!scannerMode} onOpenChange={(open) => !open && setScannerMode(null)}>
            <DialogContent>
                <DialogHeader><DialogTitle>Escanear Código QR</DialogTitle><DialogDescription>Apunta la cámara al código del pase de invitado o paquete.</DialogDescription></DialogHeader>
                <QrScanner onScan={handleQrScan} />
            </DialogContent>
        </Dialog>
        <Dialog open={!!viewingPeticion} onOpenChange={(open) => !open && setViewingPeticion(null)}>
            <DialogContent className="max-w-2xl">
                {viewingPeticion && user && (
                    <PeticionDetails 
                        peticion={viewingPeticion}
                        currentUser={user}
                        onUpdate={handleUpdatePeticion}
                        onClose={() => setViewingPeticion(null)}
                        canChangeStatus={false}
                    />
                )}
            </DialogContent>
        </Dialog>
        {showSuccessOverlay && (
            <div 
                data-state={showSuccessOverlay ? 'open' : 'closed'} 
                className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
            >
              <div
                className="bg-green-600 text-white p-8 rounded-lg flex flex-col items-center gap-4 animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95"
              >
                <div className="bg-white rounded-full p-2">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <p className="text-xl font-bold text-center uppercase">Entrega de Paquete<br/>Registrada Exitosamente</p>
              </div>
            </div>
        )}
        <Dialog open={!!scannedResident} onOpenChange={(open) => !open && setScannedResident(null)}>
            <DialogContent className="max-w-sm w-full">
                <DialogHeader className="text-center">
                    <DialogTitle>Residente Detectado</DialogTitle>
                    <DialogDescription>
                        Se ha escaneado a <strong>{scannedResident?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                    <Button size="lg" className="h-16 text-lg" onClick={() => handleValidateResident(scannedResident!.id)}>Validar Acceso</Button>
                    <Button size="lg" className="h-16 text-lg" variant="secondary" onClick={() => {
                        setResidentForRegistration(scannedResident);
                        setScannedResident(null);
                    }}>Registrar como Visita</Button>
                    <Button size="lg" className="h-12 text-lg" variant="outline" onClick={() => setScannedResident(null)}>Cancelar</Button>
                </div>
            </DialogContent>
        </Dialog>
         <Dialog open={!!residentForRegistration} onOpenChange={(open) => !open && setResidentForRegistration(null)}>
            {residentForRegistration && (
                <RegistrationTypeDialog
                    resident={residentForRegistration}
                    onClose={() => setResidentForRegistration(null)}
                    onSelect={handleSelectRegistrationType}
                />
            )}
        </Dialog>
         <Dialog open={isVehicleSelectionOpen} onOpenChange={(open) => !open && setIsVehicleSelectionOpen(false)}>
            {residentForRegistration && (
                <VehicleSelectionDialog
                    vehicles={vehiclesForSelection}
                    onClose={() => setIsVehicleSelectionOpen(false)}
                    onSelect={handleSelectVehicleForResident}
                />
            )}
        </Dialog>
        {validationResult && (
            <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center animate-in fade-in-0" onClick={() => setValidationResult(null)}>
                <Card className={cn(
                    "w-full max-w-sm m-4 text-center animate-in zoom-in-95 overflow-hidden",
                    validationResult.status === 'success' && 'bg-green-600 text-white',
                    validationResult.status === 'warning' && 'bg-yellow-500 text-black',
                    validationResult.status === 'error' && 'bg-red-600 text-white',
                )}>
                    <CardContent className="p-8 flex flex-col items-center gap-6">
                    {validationResult.status === 'success' && validationResult.user && (
                        <>
                            <div className="bg-white rounded-full p-2"><CheckCircle className="h-20 w-20 text-green-600" /></div>
                            <Avatar className="w-32 h-32 border-4 border-white">
                                <AvatarImage src={validationResult.user.photoUrl} alt={validationResult.user.name} />
                                <AvatarFallback>{validationResult.user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <p className="text-lg font-bold">{validationResult.user.role}</p>
                                <p className="text-3xl font-bold -mt-2">{validationResult.user.name}</p>
                                <p className="text-base">{validationResult.account?.address || 'Domicilio no encontrado'}</p>
                                <Badge className="bg-white text-green-700 text-base">AL CORRIENTE</Badge>
                            </div>
                        </>
                    )}
                    {validationResult.status === 'warning' && validationResult.user && (
                         <>
                            <div className="bg-white rounded-full p-2"><AlertTriangle className="h-20 w-20 text-yellow-500" /></div>
                             <Avatar className="w-32 h-32 border-4 border-white">
                                <AvatarImage src={validationResult.user.photoUrl} alt={validationResult.user.name} />
                                <AvatarFallback>{validationResult.user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-2">
                                <p className="text-lg font-bold">{validationResult.user.role}</p>
                                <p className="text-3xl font-bold -mt-2">{validationResult.user.name}</p>
                                <p className="text-base">{validationResult.account?.address || 'Domicilio no encontrado'}</p>
                                <Badge variant="destructive" className="text-base text-lg px-4 py-1">MOROSO</Badge>
                            </div>
                        </>
                    )}
                    {validationResult.status === 'error' && (
                         <>
                            <div className="bg-white rounded-full p-2"><XCircle className="h-20 w-20 text-red-600" /></div>
                            <div className="space-y-4">
                                <p className="text-3xl font-bold">Residente no Encontrado</p>
                                <p className="text-base">El código QR no es válido o el usuario no existe en el sistema.</p>
                            </div>
                        </>
                    )}
                    </CardContent>
                </Card>
            </div>
        )}
    </div>
  );
}
