
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
import { Car, User, Download, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCondominios } from "@/lib/condominioService";
import { getVehicularRegistrations, getPedestrianRegistrations } from "@/lib/registrationService";
import type { VehicularRegistration, PedestrianRegistration, Condominio, User as UserType } from "@/lib/definitions";
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

function formatTimestamp(timestamp?: string) {
    if (!timestamp) return <span className="text-muted-foreground">Pendiente</span>;
    const date = new Date(timestamp);
    return format(date, "d MMM, HH:mm'h'", { locale: es });
}

function calculateDuration(start?: string, end?: string): string {
    if (!start || !end) return "-";
    return formatDistanceStrict(new Date(end), new Date(start), { locale: es, unit: 'minute' });
}

function RegistrosVehicularesTable({ registros, onViewPhotos }: { registros: VehicularRegistration[], onViewPhotos: (reg: VehicularRegistration) => void }) {
    if (registros.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-8">No hay registros vehiculares para mostrar con los filtros seleccionados.</p>;
    }
    
    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Placa</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Domicilio</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Fotos</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {registros.map((reg) => (
                        <TableRow key={reg.id}>
                            <TableCell className="font-mono bg-muted/50 rounded-md">{reg.licensePlate}</TableCell>
                            <TableCell className="font-medium">{reg.fullName}</TableCell>
                            <TableCell>{reg.address}</TableCell>
                            <TableCell>{formatTimestamp(reg.entryTimestamp)}</TableCell>
                            <TableCell>{formatTimestamp(reg.exitTimestamp)}</TableCell>
                             <TableCell>{calculateDuration(reg.entryTimestamp, reg.exitTimestamp)}</TableCell>
                            <TableCell>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8"
                                    onClick={() => onViewPhotos(reg)}
                                    disabled={!reg.visitorIdPhotoUrl}
                                >
                                    <Camera className="h-4 w-4" />
                                    <span className="sr-only">Ver Fotos</span>
                                </Button>
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge variant={reg.exitTimestamp ? "secondary" : "default"}>
                                    {reg.exitTimestamp ? "Completado" : "Activo"}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function RegistrosPeatonalesTable({ registros }: { registros: PedestrianRegistration[] }) {
    if (registros.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-8">No hay registros peatonales para mostrar con los filtros seleccionados.</p>;
    }

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo Visitante</TableHead>
                        <TableHead>Domicilio</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {registros.map((reg) => (
                        <TableRow key={reg.id}>
                            <TableCell className="font-medium">{reg.fullName}</TableCell>
                            <TableCell>{reg.visitorType}</TableCell>
                            <TableCell>{reg.address}</TableCell>
                            <TableCell>{formatTimestamp(reg.entryTimestamp)}</TableCell>
                            <TableCell>{formatTimestamp(reg.exitTimestamp)}</TableCell>
                            <TableCell>{calculateDuration(reg.entryTimestamp, reg.exitTimestamp)}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={reg.exitTimestamp ? "secondary" : "default"}>
                                    {reg.exitTimestamp ? "Completado" : "Activo"}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

export default function RegistrosPage() {
    const { toast } = useToast();
    const [vehicularRegistros, setVehicularRegistros] = useState<VehicularRegistration[]>([]);
    const [peatonalRegistros, setPeatonalRegistros] = useState<PedestrianRegistration[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [selectedCondo, setSelectedCondo] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [viewingPhotos, setViewingPhotos] = useState<VehicularRegistration | null>(null);
    const [activeView, setActiveView] = useState('vehicular');
    const [currentUser, setCurrentUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

     useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(true);
        const userCondoId = currentUser.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        
        async function fetchData() {
            setVehicularRegistros(await getVehicularRegistrations(userCondoId));
            setPeatonalRegistros(await getPedestrianRegistrations(userCondoId));
            setIsLoading(false);
        }
        
        fetchData();
        
        const allCondos = getCondominios();
        if (userCondoId) {
            setCondominios(allCondos.filter(c => c.id === userCondoId));
        } else {
            setCondominios(allCondos);
        }
    }, [currentUser]);


    const handleExport = () => {
        toast({
            variant: "warning",
            title: "Función en desarrollo",
            description: "La exportación a CSV estará disponible próximamente."
        });
    }

    const filteredVehicular = vehicularRegistros.filter(r => 
        (currentUser?.role === 'Adm. Condo' || selectedCondo === 'all' || r.condominioId === selectedCondo) &&
        (searchTerm === "" || 
         r.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
         r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const filteredPeatonal = peatonalRegistros.filter(r => 
         (currentUser?.role === 'Adm. Condo' || selectedCondo === 'all' || r.condominioId === selectedCondo) &&
        (searchTerm === "" || 
         r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         r.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )
        }

        if (activeView === 'vehicular') {
            return (
                 <Card>
                    <CardHeader>
                        <CardTitle>Registros Vehiculares</CardTitle>
                        <CardDescription>
                            Mostrando {filteredVehicular.length} registros.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegistrosVehicularesTable registros={filteredVehicular} onViewPhotos={setViewingPhotos} />
                    </CardContent>
                </Card>
            )
        }
        
        if (activeView === 'peatonal') {
             return (
                <Card>
                    <CardHeader>
                        <CardTitle>Registros Peatonales</CardTitle>
                        <CardDescription>
                            Mostrando {filteredPeatonal.length} registros.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RegistrosPeatonalesTable registros={filteredPeatonal} />
                    </CardContent>
                </Card>
            )
        }
    }

    return (
        <>
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Registros de Acceso</h2>
                    <p className="text-muted-foreground">Consulta el historial de entradas y salidas del sistema.</p>
                </div>
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                        placeholder="Buscar por placa, nombre o domicilio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow"
                    />
                    {currentUser?.role !== 'Adm. Condo' && (
                        <Select value={selectedCondo} onValueChange={setSelectedCondo}>
                            <SelectTrigger className="w-full sm:w-[220px]">
                                <SelectValue placeholder="Filtrar por condominio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Condominios</SelectItem>
                                {condominios.map(condo => (
                                    <SelectItem key={condo.id} value={condo.id}>{condo.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <Button variant={activeView === 'vehicular' ? 'default' : 'outline'} onClick={() => setActiveView('vehicular')}>
                    <Car className="mr-2 h-4 w-4"/>Vehicular
                </Button>
                <Button variant={activeView === 'peatonal' ? 'default' : 'outline'} onClick={() => setActiveView('peatonal')}>
                    <User className="mr-2 h-4 w-4"/>Peatonal
                </Button>
            </div>
            
           {renderContent()}

        </div>
        <Dialog open={!!viewingPhotos} onOpenChange={(open) => !open && setViewingPhotos(null)}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Fotos del Registro Vehicular</DialogTitle>
                    <DialogDescription>
                        Vehículo con placas {viewingPhotos?.licensePlate} registrado por {viewingPhotos?.fullName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-center">Foto de Identificación</h4>
                        <div className="relative aspect-video w-full bg-muted rounded-md">
                            {viewingPhotos?.visitorIdPhotoUrl ? <Image src={viewingPhotos.visitorIdPhotoUrl} alt="Foto de ID" layout="fill" className="object-contain"/> : <p className="text-center text-muted-foreground p-4">No disponible</p>}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium text-center">Foto del Vehículo</h4>
                         <div className="relative aspect-video w-full bg-muted rounded-md">
                            {viewingPhotos?.vehiclePhotoUrl ? <Image src={viewingPhotos.vehiclePhotoUrl} alt="Foto del vehículo" layout="fill" className="object-contain"/> : <p className="text-center text-muted-foreground p-4">No disponible</p>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        </>
    );
}
