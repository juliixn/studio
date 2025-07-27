
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
import { Badge } from "@/components/ui/badge";
import type { VisitorNotification, Condominio, User } from "@/lib/definitions";
import { getVisitorNotifications } from "@/lib/visitorNotificationService";
import { getCondominios } from "@/lib/condominioService";
import { format } from 'date-fns/format';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatTimestamp(timestamp: string) {
    return format(new Date(timestamp), "d MMM yyyy, HH:mm'h'", { locale: es });
}

export default function NotificacionesAdminPage() {
    const [notifications, setNotifications] = useState<VisitorNotification[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [selectedCondo, setSelectedCondo] = useState<string>("all");
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
        setNotifications(getVisitorNotifications(userCondoId));
        
        if (userCondoId) {
            setCondominios(allCondos.filter(c => c.id === userCondoId));
            setSelectedCondo(userCondoId);
        } else {
            setCondominios(allCondos);
        }
    }, [currentUser]);

    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || getCondominios().find(c => c.id === condoId)?.name || 'N/A';
    
    const getStatusVariant = (status: VisitorNotification['status']) => {
        switch (status) {
            case 'Activa': return 'default';
            case 'Utilizada': return 'secondary';
            case 'Cancelada': return 'destructive';
            default: return 'outline';
        }
    }

    const filteredNotifications = notifications.filter(n => 
        currentUser?.role === 'Adm. Condo' || selectedCondo === 'all' || n.condominioId === selectedCondo
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Historial de Notificaciones</CardTitle>
                        <CardDescription>Consulta todas las notificaciones de visitantes generadas.</CardDescription>
                    </div>
                    {currentUser?.role !== 'Adm. Condo' && (
                        <div className="w-full sm:w-auto sm:min-w-[250px]">
                            <Select value={selectedCondo} onValueChange={setSelectedCondo}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por condominio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Condominios</SelectItem>
                                    {condominios.map(condo => (
                                        <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Visitante (Quién)</TableHead>
                                <TableHead>Asunto</TableHead>
                                <TableHead>Residente</TableHead>
                                <TableHead>Condominio</TableHead>
                                <TableHead>Fecha Creación</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNotifications.map((n) => (
                                <TableRow key={n.id}>
                                    <TableCell className="font-medium">{n.who}</TableCell>
                                    <TableCell>{n.subject}</TableCell>
                                    <TableCell>{n.residentName}</TableCell>
                                    <TableCell>{getCondoName(n.condominioId)}</TableCell>
                                    <TableCell>{formatTimestamp(n.createdAt)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={getStatusVariant(n.status)}>{n.status}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
