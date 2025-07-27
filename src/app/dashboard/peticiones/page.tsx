
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
import { PlusCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from 'next/link';

import type { Peticion, User, PeticionStatus } from "@/lib/definitions";
import PeticionDetails from "@/components/peticion-details";
import PeticionForm from "@/components/peticion-form";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns/format';
import { es } from 'date-fns/locale';
import { getPeticiones, addPeticion, updatePeticion } from "@/lib/peticionService";

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

export default function MisPeticionesPage() {
    const { toast } = useToast();
    const [peticiones, setPeticiones] = useState<Peticion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedPeticion, setSelectedPeticion] = useState<Peticion | undefined>(undefined);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            refreshPeticiones(user.id);
        } else {
            setIsLoading(false);
        }
    }, []);

    const refreshPeticiones = async (userId: string) => {
        setIsLoading(true);
        const data = await getPeticiones(undefined, userId);
        setPeticiones(data);
        setIsLoading(false);
    };

    const handleViewDetails = (peticion: Peticion) => {
        setSelectedPeticion(peticion);
        setIsDetailsOpen(true);
        // Mark as seen
        if (currentUser) {
            const lastComment = peticion.comments[peticion.comments.length - 1];
            if (lastComment && lastComment.authorId !== currentUser.id) {
                const seenPeticiones = JSON.parse(localStorage.getItem(`seenPeticiones_${currentUser.id}`) || '{}');
                seenPeticiones[peticion.id] = lastComment.createdAt;
                localStorage.setItem(`seenPeticiones_${currentUser.id}`, JSON.stringify(seenPeticiones));
            }
        }
    };
    
    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedPeticion(undefined);
    };

    const handleUpdatePeticion = async (updatedPeticion: Peticion) => {
        if (!currentUser) return;
        await updatePeticion(updatedPeticion.id, updatedPeticion);
        refreshPeticiones(currentUser.id);
    };

    const handleCreatePeticion = async (values: { title: string; description: string; }) => {
        if (!currentUser || !currentUser.condominioId) {
            toast({ title: "Error", description: "No se puede crear la petición. Información de usuario o condominio incompleta.", variant: "destructive" });
            return;
        }

        await addPeticion({
            ...values,
            creatorId: currentUser.id,
            creatorName: currentUser.name,
            creatorRole: currentUser.role,
            condominioId: currentUser.condominioId,
            condominioName: "N/A" // This could be fetched if needed, but not critical for resident view
        });
        
        toast({ title: "Petición Creada", description: "Tu petición ha sido enviada al administrador." });
        refreshPeticiones(currentUser.id);
        setIsFormOpen(false);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Link href="/dashboard" passHref>
                        <Button variant="outline" size="icon" aria-label="Volver al panel" className="flex-shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold tracking-tight">Mis Peticiones</h2>
                        <p className="text-muted-foreground">Envía y da seguimiento a tus solicitudes, quejas o sugerencias.</p>
                    </div>
                     <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Petición
                    </Button>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Peticiones</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : peticiones.length > 0 ? peticiones.map((peticion, index) => (
                                        <TableRow key={peticion.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
                                            <TableCell className="font-medium">{peticion.title}</TableCell>
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
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No has creado ninguna petición todavía.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                 <DialogContent>
                    <PeticionForm 
                        onSubmit={handleCreatePeticion}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && handleCloseDetails()}>
                <DialogContent className="max-w-2xl">
                    {selectedPeticion && currentUser && (
                        <PeticionDetails 
                            peticion={selectedPeticion}
                            currentUser={currentUser}
                            onUpdate={handleUpdatePeticion}
                            onClose={handleCloseDetails}
                            canChangeStatus={false}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
