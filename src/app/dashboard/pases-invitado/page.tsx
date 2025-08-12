
"use client";

import { useState, useEffect } from "react";
import { getGuestPasses, deleteGuestPass } from "@/lib/guestPassService";
import { getVisitorNotifications, updateVisitorNotification } from "@/lib/visitorNotificationService";
import { getCondominios } from "@/lib/condominioService";
import { getDomicilios } from "@/lib/domicilioService";

import type { GuestPass, User, Address, Condominio, VisitorNotification } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateGuestPassForm from "@/components/create-guest-pass-form";
import VisitorNotificationForm from "@/components/visitor-notification-form";
import QrCodeDisplay from "@/components/qr-code-display";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Car, User as UserIcon, QrCode, Bell, Trash2, CalendarOff, History } from "lucide-react";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { isPast } from "date-fns/isPast";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PasesInvitadoPage() {
    const { toast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [allPasses, setAllPasses] = useState<GuestPass[]>([]);
    const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    
    const refreshData = (userId: string) => {
        getGuestPasses(undefined, userId).then(setAllPasses);
        getVisitorNotifications(undefined, userId).then(setNotifications);
    };

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
            refreshData(storedUser.id);
            getCondominios().then(setCondominios);
            getDomicilios().then(setAddresses);
        }
    }, []);

    const handleCreatePass = () => {
        if (!user) return;
        refreshData(user.id);
        toast({ title: "Pase creado", description: "Tu pase de invitado ha sido generado." });
    };

    const handleDeletePass = (passId: string) => {
        if (!user) return;
        deleteGuestPass(passId);
        refreshData(user.id);
        toast({ title: "Pase eliminado" });
    };
    
    const handleNotificationCreated = () => {
        if (!user) return;
        refreshData(user.id);
    }
    
    const handleCancelNotification = (notificationId: string) => {
        if (!user) return;
        updateVisitorNotification(notificationId, { status: 'Cancelada' });
        refreshData(user.id);
        toast({ title: "Notificación Cancelada" });
    }
    
    const validPasses = allPasses.filter(p => p.passType === 'permanent' || (p.validUntil && !isPast(new Date(p.validUntil))));
    const expiredPasses = allPasses.filter(p => p.passType === 'temporal' && p.validUntil && isPast(new Date(p.validUntil)));
    const activeNotifications = notifications.filter(n => n.status === 'Activa');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" passHref>
                    <Button variant="outline" size="icon" aria-label="Volver al panel">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pases y Notificaciones</h2>
                    <p className="text-muted-foreground">Gestiona el acceso de tus invitados y notifica al personal de seguridad.</p>
                </div>
            </div>

            <Tabs defaultValue="qr">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="qr"><QrCode className="mr-2 h-4 w-4" /> Generar Pase QR</TabsTrigger>
                    <TabsTrigger value="notification"><Bell className="mr-2 h-4 w-4" /> Notificar Visita</TabsTrigger>
                </TabsList>
                
                <TabsContent value="qr" className="mt-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Generar Pase con QR</CardTitle>
                                <CardDescription>
                                    Crea un pase con toda la información para un acceso rápido y seguro.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user && (
                                    <CreateGuestPassForm
                                        user={user}
                                        condominios={condominios}
                                        addresses={addresses}
                                        onPassCreated={handleCreatePass}
                                    />
                                )}
                            </CardContent>
                        </Card>

                         <div className="lg:col-span-2 space-y-6">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Pases Válidos ({validPasses.length})</CardTitle>
                                    <CardDescription>Pases permanentes o temporales que aún no han expirado.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {validPasses.length > 0 ? (
                                        <div className="space-y-4">
                                            {validPasses.map(pass => (
                                                <QrCodeDisplay key={pass.id} pass={pass} onDelete={handleDeletePass} />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-10">No tienes pases válidos actualmente.</p>
                                    )}
                                </CardContent>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><History className="h-5 w-5"/>Pases Expirados</CardTitle>
                                    <CardDescription>Historial de los pases de invitado que ya han vencido.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {expiredPasses.length > 0 ? (
                                        <ul className="space-y-3 max-h-60 overflow-y-auto">
                                            {expiredPasses.map(pass => (
                                                <li key={pass.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md opacity-60">
                                                    <div>
                                                        <p className="font-medium">{pass.guestName}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <CalendarOff className="h-3.5 w-3.5"/>
                                                            Expiró: {format(new Date(pass.validUntil!), 'PPP', { locale: es })}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="gap-1.5 pl-1.5">
                                                        {pass.accessType === 'vehicular' ? <Car className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                                                        {pass.accessType === 'vehicular' ? 'Vehicular' : 'Peatonal'}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-10">No tienes pases expirados.</p>
                                    )}
                                </CardContent>
                            </Card>
                         </div>
                    </div>
                </TabsContent>

                <TabsContent value="notification" className="mt-4">
                     <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notificar Visita Futura</CardTitle>
                                <CardDescription>
                                    Crea una notificación simple para que el guardia esté al tanto de una próxima visita.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {user ? (
                                    <VisitorNotificationForm
                                        user={user}
                                        condominios={condominios}
                                        addresses={addresses}
                                        onNotificationCreated={handleNotificationCreated}
                                    />
                                ) : null}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Notificaciones Activas</CardTitle>
                                <CardDescription>Estas son las notificaciones pendientes que el guardia puede ver.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activeNotifications.length > 0 ? (
                                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                                        {activeNotifications.map(n => (
                                            <li key={n.id} className="flex justify-between items-start p-3 bg-muted/50 rounded-md">
                                                <div>
                                                    <p className="font-medium">{n.who}</p>
                                                    <p className="text-sm text-muted-foreground">Asunto: {n.subject}</p>
                                                    <p className="text-xs text-muted-foreground/80 mt-1">
                                                        Creado {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                                                    </p>
                                                </div>
                                                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleCancelNotification(n.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-muted-foreground py-10">No tienes notificaciones activas.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
