
"use client";

import { useState } from "react";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { es } from "date-fns/locale";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Peticion, PeticionComment, User, PeticionStatus, WorkOrder, Condominio } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wrench } from "lucide-react";
import { WorkOrderForm } from "./admin/work-order-form";
import { addWorkOrder } from "@/lib/workOrderService";
import { getCondominios } from "@/lib/condominioService";
import { updatePeticion as updatePeticionService} from "@/lib/peticionService";


interface PeticionDetailsProps {
    peticion: Peticion;
    currentUser: User;
    onUpdate: (peticion: Peticion) => void;
    onClose: () => void;
    canChangeStatus: boolean;
}

const commentSchema = z.string().min(1, "El comentario no puede estar vacío.").max(500, "El comentario es demasiado largo.");
const statusValues: [PeticionStatus, ...PeticionStatus[]] = ['Abierta', 'En Progreso', 'Cerrada'];

export default function PeticionDetails({ peticion, currentUser, onUpdate, onClose, canChangeStatus }: PeticionDetailsProps) {
    const { toast } = useToast();
    const [newComment, setNewComment] = useState("");
    const [newStatus, setNewStatus] = useState<PeticionStatus>(peticion.status);
    const [isCommenting, setIsCommenting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false);

    const handleAddComment = () => {
        const validation = commentSchema.safeParse(newComment);
        if (!validation.success) {
            toast({
                title: "Error",
                description: validation.error.errors[0].message,
                variant: "destructive",
            });
            return;
        }

        setIsCommenting(true);
        setTimeout(() => {
            const comment: PeticionComment = {
                id: `comm${Date.now()}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                text: newComment,
                createdAt: new Date().toISOString(),
            };

            const updatedPeticion = { ...peticion, comments: [...peticion.comments, comment] };
            onUpdate(updatedPeticion);
            setNewComment("");
            toast({ title: "Comentario añadido" });
            setIsCommenting(false);
        }, 500);
    };

    const handleSaveChanges = () => {
        setIsSaving(true);
         setTimeout(() => {
            const updatedPeticion = { ...peticion, status: newStatus };
            onUpdate(updatedPeticion);
            onClose();
            toast({ title: "Petición actualizada", description: `El estado ha cambiado a "${newStatus}".` });
            setIsSaving(false);
        }, 500);
    };
    
    const handleCreateWorkOrder = (values: Omit<WorkOrder, 'id' | 'createdAt' | 'status'>) => {
        addWorkOrder(values);
        toast({ title: "Orden de Trabajo Creada", description: `Se ha creado una orden de trabajo para "${values.title}".` });
        updatePeticionService(peticion.id, { status: 'En Progreso' });
        setIsWorkOrderFormOpen(false);
        onClose();
    }
    
    const initialWorkOrderData = {
        title: `OT: ${peticion.title}`,
        description: peticion.description,
        peticionId: peticion.id,
        condominioId: peticion.condominioId,
        address: 'Revisar petición',
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{peticion.title}</DialogTitle>
                <DialogDescription>
                    Petición creada por {peticion.creatorName} ({peticion.creatorRole}) en {peticion.condominioName}
                    {" "} - {format(new Date(peticion.createdAt), "d MMM yyyy", { locale: es })}.
                </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="col-span-1 md:col-span-2">
                    <p className="font-semibold mb-2">Descripción</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{peticion.description}</p>
                    
                    <Separator className="my-4" />

                    <p className="font-semibold mb-2">Historial de Comentarios</p>
                    <ScrollArea className="h-48 pr-4">
                        <div className="space-y-4">
                            {peticion.comments.length > 0 ? peticion.comments.map(comment => (
                                <div key={comment.id} className="text-sm">
                                    <p className="font-semibold">{comment.authorName}</p>
                                    <p className="text-muted-foreground">{comment.text}</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios todavía.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="col-span-1 md:col-span-1 space-y-4">
                     <div>
                        <p className="font-semibold mb-2">Estado Actual</p>
                        <Badge variant={peticion.status === 'Cerrada' ? 'outline' : peticion.status === 'En Progreso' ? 'secondary' : 'default'}>
                            {peticion.status}
                        </Badge>
                    </div>
                   {canChangeStatus && (
                        <div>
                            <p className="font-semibold mb-2">Cambiar Estado</p>
                            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PeticionStatus)} disabled={isSaving}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusValues.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                   )}
                   {canChangeStatus && peticion.status !== 'Cerrada' && (
                       <div>
                           <p className="font-semibold mb-2">Acciones</p>
                           <Button variant="outline" className="w-full" onClick={() => setIsWorkOrderFormOpen(true)}>
                               <Wrench className="mr-2 h-4 w-4"/> Crear Orden de Trabajo
                           </Button>
                       </div>
                   )}
                </div>
            </div>

            <Separator />

            <div className="space-y-2 pt-4">
                <p className="font-semibold">Añadir un nuevo comentario</p>
                <Textarea 
                    placeholder="Escribe tu respuesta o actualización aquí..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={isCommenting}
                />
                <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim() || isCommenting}>
                     {isCommenting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Añadir Comentario
                </Button>
            </div>
            
            <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
                {canChangeStatus && (
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                )}
            </DialogFooter>

             <Dialog open={isWorkOrderFormOpen} onOpenChange={setIsWorkOrderFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Orden desde Petición</DialogTitle>
                    </DialogHeader>
                    <WorkOrderForm
                        workOrder={initialWorkOrderData as WorkOrder}
                        condominios={getCondominios()}
                        onSubmit={handleCreateWorkOrder}
                        onCancel={() => setIsWorkOrderFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}
