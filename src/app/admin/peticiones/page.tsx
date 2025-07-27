
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Peticion, User } from "@/lib/definitions";
import PeticionDetails from "@/components/peticion-details";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPeticiones, updatePeticion } from "@/lib/peticionService";
import { Loader2 } from "lucide-react";

function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return format(date, "d MMM yyyy, HH:mm'h'", { locale: es });
}

function getStatusVariant(status: Peticion['status']) {
    switch (status) {
        case 'Abierta':
            return 'default';
        case 'En Progreso':
            return 'secondary';
        case 'Cerrada':
            return 'outline';
        default:
            return 'default';
    }
}

export default function PeticionesAdminPage() {
    const [peticiones, setPeticiones] = useState<Peticion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPeticion, setSelectedPeticion] = useState<Peticion | undefined>(undefined);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const refreshPeticiones = async (userCondoId?: string) => {
        setIsLoading(true);
        const data = await getPeticiones(userCondoId);
        setPeticiones(data);
        setIsLoading(false);
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user: User = JSON.parse(storedUser);
            setCurrentUser(user);
            const userCondoId = user.role === 'Adm. Condo' ? user.condominioId : undefined;
            refreshPeticiones(userCondoId);
        } else {
            refreshPeticiones();
        }
    }, []);

    const handleViewDetails = (peticion: Peticion) => {
        setSelectedPeticion(peticion);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedPeticion(undefined);
    };

    const handleUpdatePeticion = async (updatedPeticion: Peticion) => {
        await updatePeticion(updatedPeticion.id, updatedPeticion);
        const userCondoId = currentUser?.role === 'Adm. Condo' ? currentUser.condominioId : undefined;
        refreshPeticiones(userCondoId);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Peticiones</CardTitle>
                    <CardDescription>Revisa, responde y da seguimiento a todas las peticiones generadas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Condominio</TableHead>
                                    <TableHead>Creado por</TableHead>
                                    <TableHead>Rol</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : peticiones.map((peticion, index) => (
                                    <TableRow key={peticion.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
                                        <TableCell className="font-medium">{peticion.title}</TableCell>
                                        <TableCell>{peticion.condominioName}</TableCell>
                                        <TableCell>{peticion.creatorName}</TableCell>
                                        <TableCell><Badge variant="outline">{peticion.creatorRole}</Badge></TableCell>
                                        <TableCell>{formatTimestamp(peticion.createdAt)}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={getStatusVariant(peticion.status)}>{peticion.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(peticion)}>
                                                Ver Detalles
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && handleCloseDetails()}>
                <DialogContent className="max-w-2xl">
                    {selectedPeticion && currentUser && (
                        <PeticionDetails 
                            peticion={selectedPeticion}
                            currentUser={currentUser}
                            onUpdate={handleUpdatePeticion}
                            onClose={handleCloseDetails}
                            canChangeStatus={true}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
