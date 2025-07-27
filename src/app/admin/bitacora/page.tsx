
"use client";

import { useState, useEffect, useRef } from "react";
import { getBitacora, updateBitacoraEntry } from "@/lib/bitacoraService";
import type { BitacoraEntry, Condominio, User } from "@/lib/definitions";
import { getCondominios } from "@/lib/condominioService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BitacoraTimeline from "@/components/bitacora-timeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Camera, Edit, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CameraCaptureDialog } from "@/components/camera-capture-dialog";

function BitacoraEditDialog({ entry, onUpdate, onClose }: { entry: BitacoraEntry, onUpdate: () => void, onClose: () => void }) {
    const { toast } = useToast();
    const [text, setText] = useState(entry.text);
    const [photos, setPhotos] = useState<string[]>(entry.photos || []);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    
    const handleCapture = (dataUrl: string) => {
        setPhotos(prev => [...prev, dataUrl]);
    };

    const handleRemovePhoto = (indexToRemove: number) => {
        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveChanges = async () => {
        if (text.trim() === "" && photos.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "El reporte no puede estar vacío." });
            return;
        }
        await updateBitacoraEntry(entry.id, { text, photos });
        toast({ title: "Entrada actualizada", description: "Los cambios han sido guardados." });
        onUpdate();
        onClose();
    };

    return (
        <>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Novedad en Bitácora</DialogTitle>
                    <DialogDescription>Modifica el texto o las fotos del reporte. Los cambios quedarán registrados.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="min-h-[120px]"
                    />
                     {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative group aspect-square">
                                    <Image src={photo} alt={`Foto ${index + 1}`} fill sizes="100px" className="rounded-md object-cover" />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleRemovePhoto(index)}
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Eliminar foto</span>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" onClick={() => setIsCameraOpen(true)}>
                        <Camera className="mr-2 h-4 w-4" /> Añadir Foto
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}><Edit className="mr-2 h-4 w-4" />Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>

            <CameraCaptureDialog
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCapture}
                title="Añadir Foto"
                description="Tome una foto para adjuntar como evidencia."
            />
        </>
    )
}

export default function BitacoraAdminPage() {
    const [allEntries, setAllEntries] = useState<BitacoraEntry[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [editingEntry, setEditingEntry] = useState<BitacoraEntry | null>(null);
    const [selectedCondoId, setSelectedCondoId] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async (userCondoFilter?: string) => {
        setIsLoading(true);
        const data = await getBitacora(userCondoFilter);
        setAllEntries(data);
        setIsLoading(false);
    };

    useEffect(() => {
        const storedUser = sessionStorage.getItem('loggedInUser');
        if (storedUser) {
            const user: User = JSON.parse(storedUser);
            setCurrentUser(user);

            let condoIdToFilter: string | undefined = undefined;
            const allAvailableCondos = getCondominios();

            if (user.role === 'Adm. Condo') {
                const sessionCondoId = sessionStorage.getItem('selectedCondoId');
                condoIdToFilter = sessionCondoId || user.condominioIds?.[0];
                const userCondos = allAvailableCondos.filter(c => user.condominioIds?.includes(c.id));
                setCondominios(userCondos);
                setSelectedCondoId(condoIdToFilter || userCondos[0]?.id || 'all');
            } else { // Administrador
                setCondominios(allAvailableCondos);
                setSelectedCondoId('all');
            }
            
            fetchData(condoIdToFilter);
        }
    }, [refreshKey]);
    
    const handleUpdate = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleTabChange = async (condoId: string) => {
        setSelectedCondoId(condoId);
        setIsLoading(true);
        const data = await getBitacora(condoId === 'all' ? undefined : condoId);
        setAllEntries(data);
        setIsLoading(false);
    }
    
    // Refresh data periodically
    useEffect(() => {
        const interval = setInterval(handleUpdate, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);
    
    if (!currentUser) {
        return <Skeleton className="w-full h-96" />;
    }
    
    const isAdmCondo = currentUser.role === 'Adm. Condo';

    const condoToDisplay = (condoId: string) => {
        if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin"/></div>
        return <BitacoraTimeline 
            entries={allEntries}
            currentUser={currentUser}
            onEdit={(entry) => setEditingEntry(entry)}
        />;
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bitácora de Novedades</h2>
                    <p className="text-muted-foreground">Consulta el historial de novedades por condominio.</p>
                </div>

                <Tabs value={selectedCondoId} onValueChange={handleTabChange} className="w-full">
                    <TabsList>
                        {!isAdmCondo && <TabsTrigger value="all">Todos los Condominios</TabsTrigger>}
                        {condominios.map(condo => (
                            <TabsTrigger key={condo.id} value={condo.id}>{condo.name}</TabsTrigger>
                        ))}
                    </TabsList>
                    
                     <TabsContent value={selectedCondoId} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Novedades</CardTitle>
                                <CardDescription>Mostrando novedades para la vista seleccionada.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-[60vh] overflow-y-auto pr-4">
                                    {condoToDisplay(selectedCondoId)}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
                {editingEntry && (
                    <BitacoraEditDialog 
                        entry={editingEntry}
                        onUpdate={handleUpdate}
                        onClose={() => setEditingEntry(null)}
                    />
                )}
            </Dialog>
        </>
    );
}
