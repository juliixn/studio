
"use client";

import { useState, useEffect } from "react";
import { getPackages } from "@/lib/packageService";
import type { Package, User } from "@/lib/definitions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Check, Clock, AlertTriangle, Eye, QrCode, Loader2 } from "lucide-react";
import { format } from "date-fns/format";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import QRCode from "qrcode.react";

export default function PaqueteriaPage() {
    const [user, setUser] = useState<User | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingProof, setViewingProof] = useState<{photo: string; signature: string; name?: string} | null>(null);
    const [viewingQr, setViewingQr] = useState<Package | null>(null);

    const fetchData = async (userId: string) => {
        setIsLoading(true);
        const userPackages = await getPackages(undefined, userId);
        setPackages(userPackages);
        setIsLoading(false);
    }

    useEffect(() => {
        const storedUserStr = sessionStorage.getItem('loggedInUser');
        if (storedUserStr) {
            const storedUser: User = JSON.parse(storedUserStr);
            setUser(storedUser);
            fetchData(storedUser.id);
        }
    }, []);

    const pendientes = packages.filter(p => p.status !== 'Entregado');
    const entregados = packages.filter(p => p.status === 'Entregado');

    const getStatusVariant = (status: Package['status']): "destructive" | "default" | "secondary" => {
        switch (status) {
            case 'Con Daño': return 'destructive';
            case 'En Recepción': return 'default';
            case 'Entregado': return 'secondary';
            default: return 'default';
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" passHref>
                        <Button variant="outline" size="icon" aria-label="Volver al panel">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Mis Paquetes</h2>
                        <p className="text-muted-foreground">Consulta el historial de paquetería recibida.</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Paquetes Pendientes ({pendientes.length})</CardTitle>
                        <CardDescription>Haz clic en un paquete para ver su código QR de recolección.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin"/>
                            </div>
                        ) : pendientes.length > 0 ? (
                            <ul className="space-y-3">
                                {pendientes.map(pkg => (
                                    <li key={pkg.id}>
                                        <button 
                                            onClick={() => setViewingQr(pkg)}
                                            className="w-full text-left flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md gap-2 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex-grow">
                                                <p className="font-medium">Paquete de {pkg.courierCompany}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Recibido por {pkg.receivedByGuardName} el {format(new Date(pkg.receivedAt), "PPP p", { locale: es })}
                                                </p>
                                                {pkg.damageNotes && (
                                                    <p className="text-sm text-destructive mt-1 flex items-center gap-2">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Nota de daño: {pkg.damageNotes}
                                                    </p>
                                                )}
                                                <Badge variant={getStatusVariant(pkg.status)} className="mt-2 sm:mt-0">
                                                    {pkg.status === 'Con Daño' ? <AlertTriangle className="mr-2 h-4 w-4" /> : <Clock className="mr-2 h-4 w-4" />}
                                                    {pkg.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-primary self-center mt-2 sm:mt-0">
                                                <QrCode className="h-4 w-4"/>
                                                <span className="font-medium">Mostrar QR</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes paquetes pendientes.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Paquetes Entregados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                             <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin"/>
                            </div>
                        ) : entregados.length > 0 ? (
                            <ul className="space-y-3 max-h-80 overflow-y-auto">
                                {entregados.map(pkg => (
                                    <li key={pkg.id} className="flex items-center justify-between p-3 border rounded-md">
                                        <div>
                                            <p className="font-medium text-muted-foreground">Paquete de {pkg.courierCompany}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Entregado: {pkg.deliveredAt ? format(new Date(pkg.deliveredAt), "PPP p", { locale: es }) : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {pkg.deliveryPhotoUrl && (
                                                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingProof({ photo: pkg.deliveryPhotoUrl!, signature: pkg.deliverySignatureUrl!, name: pkg.deliveredToName })}>
                                                    <Eye className="h-4 w-4" />
                                                 </Button>
                                            )}
                                            <Badge variant="secondary"><Check className="mr-2 h-4 w-4" />Entregado</Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground py-10">No tienes paquetes en tu historial.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
             <Dialog open={!!viewingProof} onOpenChange={(open) => !open && setViewingProof(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Prueba de Entrega</DialogTitle>
                    </DialogHeader>
                    {viewingProof && (
                        <div className="space-y-4 py-4">
                             {viewingProof.name && (
                                <div>
                                    <h3 className="font-semibold mb-2">Recibido por</h3>
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

            <Dialog open={!!viewingQr} onOpenChange={(open) => !open && setViewingQr(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Código QR para Recolectar</DialogTitle>
                        <DialogDescription>Muestra este código al guardia para recoger tu paquete.</DialogDescription>
                    </DialogHeader>
                    {viewingQr && (
                        <div className="flex flex-col items-center gap-4 text-center py-4">
                            <div className="p-4 bg-white rounded-lg border">
                                <QRCode
                                    value={`pkg:${viewingQr.id}`}
                                    size={220}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            <div>
                                <p className="font-medium">Paquete de {viewingQr.courierCompany}</p>
                                <p className="text-sm text-muted-foreground">Para: {viewingQr.recipientName}</p>
                                <p className="text-sm text-muted-foreground">En: {viewingQr.recipientAddress}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
