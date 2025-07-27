

"use client";

import { useEffect, useState } from 'react';
import type { User, ActiveShift, Comunicado, EmergencyContact, Peticion, ShiftRecord } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCheck, ShieldAlert, QrCode, Package, CalendarDays, Rss, FileClock, MessageSquare, Siren, Car, Wallet, Vote, Phone } from 'lucide-react';
import Link from 'next/link';
import { getComunicados } from '@/lib/comunicadoService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { addPeticion, getPeticiones } from '@/lib/peticionService';
import { useToast } from '@/hooks/use-toast';
import { addBitacoraEntry } from '@/lib/bitacoraService';
import { getEmergencyContacts } from '@/lib/emergencyService';
import { Badge } from '@/components/ui/badge';
import { getActiveShifts } from '@/lib/shiftService';
import { getCondominioById } from '@/lib/condominioService';


export default function DashboardPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [condominioName, setCondominioName] = useState<string>('');
    const [activeGuards, setActiveGuards] = useState<ShiftRecord[]>([]);
    const [latestAnnouncement, setLatestAnnouncement] = useState<Comunicado | null>(null);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [isEmergencyPanelOpen, setIsEmergencyPanelOpen] = useState(false);
    const [unseenPeticionesCount, setUnseenPeticionesCount] = useState(0);

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        if (storedUserStr) {
            const storedUser: User = JSON.parse(storedUserStr);
            setUser(storedUser);

            const fetchData = async () => {
                if (storedUser.condominioId) {
                    const condo = await getCondominioById(storedUser.condominioId);
                    setCondominioName(condo?.name || 'N/A');

                    const guardsInCondo = await getActiveShifts(storedUser.condominioId);
                    setActiveGuards(guardsInCondo);
                    
                    const announcements = getComunicados(storedUser.condominioId);
                    if (announcements.length > 0) {
                        setLatestAnnouncement(announcements[0]);
                    }

                    setEmergencyContacts(getEmergencyContacts(storedUser.condominioId));

                    // Calculate unseen petitions
                    const userPeticiones = await getPeticiones(undefined, storedUser.id);
                    const seenPeticiones = JSON.parse(localStorage.getItem(`seenPeticiones_${storedUser.id}`) || '{}');
                    let count = 0;
                    userPeticiones.forEach(peticion => {
                        const lastComment = peticion.comments[peticion.comments.length - 1];
                        if (lastComment && lastComment.authorId !== storedUser.id) {
                            if (!seenPeticiones[peticion.id] || new Date(lastComment.createdAt) > new Date(seenPeticiones[peticion.id])) {
                                count++;
                            }
                        }
                    });
                    setUnseenPeticionesCount(count);
                }
            }
            fetchData();
        }
    }, []);

    const handleSos = async () => {
        if (!user || !user.addressId) {
            toast({
                title: "Error",
                description: "No se pudo enviar la alerta. Información de usuario o domicilio incompleta.",
                variant: "destructive"
            });
            return;
        }
        
        const condo = await getCondominioById(user.condominioId!);
        const peticion = await addPeticion({
            title: `🚨 EMERGENCIA SOS: ${user.name}`,
            description: `Se ha activado una alerta de emergencia desde el domicilio asociado a ${user.name}. Se requiere asistencia inmediata.`,
            creatorId: user.id,
            creatorName: user.name,
            creatorRole: user.role,
            condominioId: user.condominioId!,
            condominioName: condo?.name || 'N/A',
            category: 'Emergencia'
        });

        if (peticion) {
            await addBitacoraEntry({
                condominioId: user.condominioId!,
                authorId: user.id,
                authorName: user.name,
                type: 'Petición Creada',
                text: `Activó alerta de emergencia SOS.`,
                relatedId: peticion.id
            });
        }


        toast({
            title: "¡ALERTA ENVIADA!",
            description: "El personal de seguridad y administración han sido notificados. Mantenga la calma.",
            variant: "destructive",
            duration: 10000
        });
    };

    if (!user) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-full" /></CardContent></Card>
                </div>
            </div>
        );
    }

    const dashboardFeatures = [
        {
            title: "Pases y Notificaciones",
            description: "Crea pases QR o notifica visitas de forma rápida y segura.",
            href: "/dashboard/pases-invitado",
            icon: QrCode
        },
        {
            title: "Mis Vehículos",
            description: "Registra tus vehículos frecuentes para agilizar futuros pases.",
            href: "/dashboard/mis-vehiculos",
            icon: Car,
            roles: ['Propietario', 'Renta']
        },
        {
            title: "Mi Estado de Cuenta",
            description: "Consulta tu historial de cargos, pagos y saldo pendiente.",
            href: "/dashboard/mi-estado-de-cuenta",
            icon: Wallet,
            roles: ['Propietario', 'Renta']
        },
        {
            title: "Mis Paquetes",
            description: "Consulta el estado de la paquetería que ha llegado para ti.",
            href: "/dashboard/paqueteria",
            icon: Package
        },
        {
            title: "Reservar Áreas Comunes",
            description: "Consulta disponibilidad y reserva el salón de eventos, canchas y más.",
            href: "/dashboard/reservaciones",
            icon: CalendarDays
        },
         {
            title: "Mis Peticiones",
            description: "Envía quejas, sugerencias o reportes a la administración.",
            href: "/dashboard/peticiones",
            icon: MessageSquare,
            notificationCount: unseenPeticionesCount,
        },
        {
            title: "Comunidad",
            description: "Participa en encuestas y mantente al día con los eventos.",
            href: "/dashboard/comunidad",
            icon: Vote
        },
        {
            title: "Reporte de Vigilancia",
            description: "Revisa la actividad y las alertas respondidas por los guardias.",
            href: "/dashboard/vigilancia",
            icon: FileClock
        }
    ];

    const showSosButton = user.role === 'Propietario' || user.role === 'Renta';
    const availableFeatures = dashboardFeatures.filter(feature => !feature.roles || feature.roles.includes(user.role));

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Bienvenido, {user.name}</h2>
                <p className="text-muted-foreground">Este es tu panel de control para el condominio: <span className="font-semibold text-primary">{condominioName}</span></p>
            </div>
            
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {availableFeatures.map(feature => (
                     <Link key={feature.href} href={feature.href}>
                        <Card className="h-full hover:border-primary transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg cursor-pointer flex flex-col relative">
                            {feature.notificationCount && feature.notificationCount > 0 && (
                                <Badge className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs">
                                    {feature.notificationCount}
                                </Badge>
                            )}
                            <CardHeader className="flex-shrink-0">
                                <CardTitle className="flex items-center gap-3">
                                    <feature.icon className="w-6 h-6 text-primary"/>
                                    {feature.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                 <Card className={showSosButton ? "lg:col-span-2" : "lg:col-span-3"}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rss className="w-6 h-6 text-primary"/>
                            Anuncios de la Administración
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {latestAnnouncement ? (
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-foreground">{latestAnnouncement.subject}</p>
                                <p>{latestAnnouncement.message}</p>
                                <p className="text-xs mt-1">
                                    {formatDistanceToNow(new Date(latestAnnouncement.createdAt), { addSuffix: true, locale: es })}
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-center text-muted-foreground py-4">
                                No hay anuncios recientes.
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {showSosButton && (
                    <Card className="bg-destructive/10 border-destructive">
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-destructive">
                                <Siren className="w-6 h-6"/>
                                Panel de Emergencia
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-sm text-destructive/80">Usa este botón <span className="font-bold">SOLO</span> en caso de una emergencia real. Se notificará al personal de inmediato.</p>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="lg" className="w-full text-lg font-bold py-6">ACTIVAR ALERTA SOS</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmar Alerta de Emergencia?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción enviará una alerta inmediata al personal de seguridad y a la administración con tu nombre y domicilio. Úsalo solo en una emergencia real.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSos} className="bg-destructive hover:bg-destructive/90">Sí, Enviar Alerta</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                             <Button variant="outline" className="w-full" onClick={() => setIsEmergencyPanelOpen(true)}>
                                <Phone className="mr-2 h-4 w-4"/> Ver Números de Emergencia
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-6 h-6 text-primary"/>
                        Guardias en Turno
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {activeGuards.length > 0 ? (
                        <ul className="space-y-3">
                            {activeGuards.map(guard => (
                                <li key={guard.guardId} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                                    <span className="font-medium">{guard.guardName}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                            <ShieldAlert className="w-10 h-10 mb-2"/>
                            <p className="text-sm">No hay guardias en turno en este momento.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isEmergencyPanelOpen} onOpenChange={setIsEmergencyPanelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Contactos de Emergencia</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estos son los contactos de emergencia para {condominioName}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {emergencyContacts.map(c => (
                            <Button key={c.id} asChild variant="outline" className="h-20 text-lg flex-col items-start p-4">
                                <a href={`tel:${c.phone}`}>
                                    <span className="font-bold">{c.name}</span>
                                    <span className="text-muted-foreground">{c.phone}</span>
                                </a>
                            </Button>
                        ))}
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
