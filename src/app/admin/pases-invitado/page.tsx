
"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GuestPass, Condominio, User, Address } from "@/lib/definitions";
import { getGuestPasses } from "@/lib/guestPassService";
import { getCondominios } from "@/lib/condominioService";
import { allAddresses as initialAddresses } from "@/lib/data";
import { format } from 'date-fns/format';
import { isPast } from 'date-fns/isPast';
import { es } from 'date-fns/locale';
import { PlusCircle, Car, User as UserIcon, CalendarOff, MapPin } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreateGuestPassForm from "@/components/create-guest-pass-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-background border rounded-md shadow-lg text-xs">
        <p className="font-bold">{data.guestName}</p>
        <p>Por: {data.residentName}</p>
        <p>Fecha: {format(new Date(data.createdAt), "PPp", { locale: es })}</p>
      </div>
    );
  }
  return null;
};


export default function PasesInvitadoAdminPage() {
    const { toast } = useToast();
    const [passes, setPasses] = useState<GuestPass[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
    const [user, setUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const parsedUser: User = JSON.parse(storedUser);
            setUser(parsedUser);
            
            const userCondoId = parsedUser.role === 'Adm. Condo' ? parsedUser.condominioId : undefined;
            const allCondos = getCondominios();
            const allAddresses = initialAddresses;

            setPasses(getGuestPasses(userCondoId));
            
            if (userCondoId) {
                setCondominios(allCondos.filter(c => c.id === userCondoId));
                setAddresses(allAddresses.filter(a => a.condominioId === userCondoId));
            } else {
                setCondominios(allCondos);
                setAddresses(allAddresses);
            }
        }
    }, []);

    const mapData = useMemo(() => {
        return passes
            .filter(p => p.latitude && p.longitude)
            .map(p => ({ ...p, lat: p.latitude, lng: p.longitude }));
    }, [passes]);

    const getCondoName = (condoId: string) => condominios.find(c => c.id === condoId)?.name || 'N/A';
    
    const handlePassCreated = () => {
        const userCondoId = user?.role === 'Adm. Condo' ? user.condominioId : undefined;
        setPasses(getGuestPasses(userCondoId));
        setIsFormOpen(false);
        toast({ title: "Pase creado", description: "El pase de invitado ha sido generado exitosamente." });
    };
    
    const getVigencia = (pass: GuestPass) => {
        if (pass.passType === 'permanent') {
            return <span className="flex items-center gap-1.5"><CalendarOff className="h-4 w-4 text-green-600" /> Permanente</span>;
        }
        if (pass.validUntil) {
            const isExpired = isPast(new Date(pass.validUntil));
            const date = new Date(pass.validUntil);
            // Adjust for timezone offset to display correct date
            const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
            return <span className={isExpired ? "text-muted-foreground line-through" : ""}>{format(adjustedDate, 'PPP', { locale: es })}</span>
        }
        return 'N/A';
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Mapa de Pases Generados
                    </CardTitle>
                    <CardDescription>
                        Visualización de la ubicación desde donde se han generado los pases de invitado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80 w-full bg-muted rounded-md" style={{backgroundImage: `url(https://placehold.co/1200x400.png)`, backgroundSize: 'cover'}} data-ai-hint="map satellite">
                         <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <XAxis type="number" dataKey="lng" domain={[-180, 180]} hide />
                                <YAxis type="number" dataKey="lat" domain={[-90, 90]} hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Pases" data={mapData} fill="hsl(var(--primary))" shape={<MapPin size={16} className="text-primary" fill="hsl(var(--primary))" />} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Historial de Pases de Invitado</CardTitle>
                            <CardDescription>Consulta y genera pases de invitado para cualquier condominio.</CardDescription>
                        </div>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Generar Pase
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invitado</TableHead>
                                    <TableHead>Tipo Acceso</TableHead>
                                    <TableHead>Residente</TableHead>
                                    <TableHead>Domicilio</TableHead>
                                    <TableHead>Condominio</TableHead>
                                    <TableHead>Vigencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {passes.map((pass) => (
                                    <TableRow key={pass.id}>
                                        <TableCell className="font-medium">{pass.guestName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1.5 pl-1.5">
                                                {pass.accessType === 'vehicular' ? <Car className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                                                {pass.accessType === 'vehicular' ? 'Vehicular' : 'Peatonal'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{pass.residentName}</TableCell>
                                        <TableCell>{pass.address}</TableCell>
                                        <TableCell>{getCondoName(pass.condominioId)}</TableCell>
                                        <TableCell>{getVigencia(pass)}</TableCell>
                                    </TableRow>
                                ))}
                                {passes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No se han generado pases de invitado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl">
                    {user && (
                        <CreateGuestPassForm
                            user={user}
                            condominios={condominios}
                            addresses={addresses}
                            onPassCreated={handlePassCreated}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
