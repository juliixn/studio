
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
import type { Package, Condominio, PackageStatus, User } from "@/lib/definitions";
import { getPackages } from "@/lib/packageService";
import { getCondominios } from "@/lib/condominioService";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const packageStatuses: PackageStatus[] = ['En Recepción', 'Entregado', 'Con Daño'];

function formatTimestamp(timestamp: string) {
    return format(new Date(timestamp), "d MMM yyyy, HH:mm'h'", { locale: es });
}

export default function PaqueteriaAdminPage() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [selectedCondo, setSelectedCondo] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [viewingProof, setViewingProof] = useState<{photo: string; signature: string; name?: string;} | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        
        const [condosData, packagesData] = await Promise.all([
            getCondominios(),
            getPackages(userCondoId)
        ]);

        if (userCondoId) {
            setCondominios(condosData.filter(c => c.id === userCondoId));
            setSelectedCondo(userCondoId);
        } else {
            setCondominios(condosData);
        }
        setPackages(packagesData);
        setIsLoading(false);
    };

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser]);

    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || 'N/A';
    
    const filteredPackages = packages.filter(pkg => {
        const condoMatch = currentUser?.role === 'Adm. Condo' || selectedCondo === 'all' || pkg.condominioId === selectedCondo;
        const statusMatch = selectedStatus === 'all' || pkg.status === selectedStatus;
        return condoMatch && statusMatch;
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Gestión de Paquetería</CardTitle>
                            <CardDescription>Consulta el historial y estado de todos los paquetes.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Select value={selectedCondo} onValueChange={setSelectedCondo} disabled={currentUser?.role === 'Adm. Condo'}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filtrar por condominio" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Condominios</SelectItem>
                                    {condominios.map(condo => (
                                        <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filtrar por estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos los Estados</SelectItem>
                                    {packageStatuses.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Destinatario</TableHead>
                                    <TableHead>Domicilio</TableHead>
                                    <TableHead>Repartidor</TableHead>
                                    <TableHead>Fecha Recepción</TableHead>
                                    <TableHead>Fecha Entrega</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-center">Prueba</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPackages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">{pkg.recipientName}</TableCell>
                                        <TableCell>{pkg.recipientAddress}</TableCell>
                                        <TableCell className="text-xs">{pkg.courierCompany} - {pkg.courierName}</TableCell>
                                        <TableCell>{formatTimestamp(pkg.receivedAt)}</TableCell>
                                        <TableCell>{pkg.deliveredAt ? formatTimestamp(pkg.deliveredAt) : 'N/A'}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={pkg.status === 'Entregado' ? 'secondary' : (pkg.status === 'Con Daño' ? 'destructive' : 'default')}>{pkg.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {pkg.status === 'Entregado' && pkg.deliveryPhotoUrl && (
                                                <Button variant="outline" size="sm" onClick={() => setViewingProof({ photo: pkg.deliveryPhotoUrl!, signature: pkg.deliverySignatureUrl!, name: pkg.deliveredToName })}>
                                                    Ver
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoading && filteredPackages.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No hay paquetes que coincidan con los filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <Dialog open={!!viewingProof} onOpenChange={(open) => !open && setViewingProof(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Prueba de Entrega</DialogTitle>
                    </DialogHeader>
                    {viewingProof && (
                        <div className="space-y-4 py-4">
                            {viewingProof.name && (
                                <div>
                                    <h3 className="font-semibold mb-2">Entregado a</h3>
                                    <p className="text-sm">{viewingProof.name}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold mb-2">Foto de Identificación y Paquete</h3>
                                <div className="relative aspect-video border rounded-md bg-muted">
                                    <Image src={viewingProof.photo} alt="Foto de entrega" layout="fill" objectFit="contain" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Firma de Recibido</h3>
                                <div className="border rounded-md bg-white p-2">
                                    <Image src={viewingProof.signature} alt="Firma de entrega" width={500} height={250} style={{ margin: 'auto' }}/>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
