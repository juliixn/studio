

"use client";

import type { User, VehicularRegistration, PedestrianRegistration, Package, Reservation } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserProfileViewProps {
    user: User;
    condominioNames?: string[];
    addressNames?: string[];
    accessHistory: (VehicularRegistration | PedestrianRegistration)[];
    packageHistory: Package[];
    reservationHistory: Reservation[];
}

function formatTimestamp(timestamp: string) {
    return format(new Date(timestamp), "d MMM yyyy, HH:mm'h'", { locale: es });
}

export default function UserProfileView({
    user,
    condominioNames,
    addressNames,
    accessHistory,
    packageHistory,
    reservationHistory
}: UserProfileViewProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoUrl} alt={user.name} data-ai-hint="profile picture" />
                            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <CardTitle className="text-3xl">{user.name}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                            <Badge>{user.role}</Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {condominioNames && condominioNames.length > 0 && <div><strong>Condominios:</strong> {condominioNames.join(', ')}</div>}
                        {addressNames && addressNames.length > 0 && <div><strong>Domicilios:</strong> {addressNames.join(', ')}</div>}
                        {user.dailySalary && <p><strong>Salario Diario:</strong> ${user.dailySalary.toFixed(2)}</p>}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="access">
                <TabsList>
                    <TabsTrigger value="access">Actividad de Accesos</TabsTrigger>
                    <TabsTrigger value="packages">Historial de Paquetería</TabsTrigger>
                    <TabsTrigger value="reservations">Reservas</TabsTrigger>
                </TabsList>

                <TabsContent value="access">
                    <Card>
                        <CardHeader><CardTitle>Accesos Registrados</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Fecha Entrada</TableHead><TableHead>Tipo</TableHead><TableHead>Placa/Info</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {accessHistory.length > 0 ? accessHistory.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{formatTimestamp(item.entryTimestamp)}</TableCell>
                                                <TableCell>{'licensePlate' in item ? 'Vehicular' : 'Peatonal'}</TableCell>
                                                <TableCell>{'licensePlate' in item ? item.licensePlate : item.visitorType}</TableCell>
                                                <TableCell><Badge variant={item.exitTimestamp ? "secondary" : "default"}>{item.exitTimestamp ? 'Completado' : 'Activo'}</Badge></TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={4} className="text-center">No hay registros de acceso.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="packages">
                     <Card>
                        <CardHeader><CardTitle>Paquetes Recibidos</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Fecha Recepción</TableHead><TableHead>Paquetería</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {packageHistory.length > 0 ? packageHistory.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{formatTimestamp(item.receivedAt)}</TableCell>
                                                <TableCell>{item.courierCompany}</TableCell>
                                                <TableCell><Badge variant={item.status === 'Entregado' ? 'secondary' : 'default'}>{item.status}</Badge></TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={3} className="text-center">No hay paquetes registrados.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="reservations">
                     <Card>
                        <CardHeader><CardTitle>Reservas de Áreas Comunes</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Área</TableHead><TableHead>Fecha</TableHead><TableHead>Horario</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {reservationHistory.length > 0 ? reservationHistory.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.areaName}</TableCell>
                                                <TableCell>{format(new Date(item.date), "PPP", { locale: es })}</TableCell>
                                                <TableCell>{item.startTime} - {item.endTime}</TableCell>
                                                <TableCell><Badge variant={item.status === 'Aprobada' ? 'default' : 'secondary'}>{item.status}</Badge></TableCell>
                                            </TableRow>
                                        )) : <TableRow><TableCell colSpan={4} className="text-center">No hay reservas realizadas.</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
