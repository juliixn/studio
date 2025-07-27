
"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User, Condominio, PlannedShift } from "@/lib/definitions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "../ui/badge";

interface ShiftAssignmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    condominio: Condominio;
    turno: 'Diurno' | 'Nocturno';
    slot: number;
    currentGuardId: string | null;
    guards: User[];
    condominios: Condominio[];
    plannedShifts: PlannedShift[];
    onAssign: (guardId: string) => void;
    onClear: () => void;
}

export default function ShiftAssignmentDialog({
    isOpen,
    onClose,
    date,
    condominio,
    turno,
    slot,
    currentGuardId,
    guards,
    condominios,
    plannedShifts,
    onAssign,
    onClear
}: ShiftAssignmentDialogProps) {

    const { unavailableGuardIds, guardToCondoMap } = useMemo(() => {
        const unavailableGuardIds = new Set<string>();
        const guardToCondoMap = new Map<string, string>();
        const dateString = format(date, 'yyyy-MM-dd');

        for (const shift of plannedShifts) {
            // Check if a guard is assigned to the same date and turn
            if (shift.guardId && shift.date === dateString && shift.turno === turno) {
                // The slot we are currently editing is not a conflict for itself
                const isCurrentSlot = shift.condominioId === condominio.id && shift.slot === slot;
                if (!isCurrentSlot) {
                    unavailableGuardIds.add(shift.guardId);
                    if (!guardToCondoMap.has(shift.guardId)) {
                        const condoName = condominios.find(c => c.id === shift.condominioId)?.name || 'otro lugar';
                        guardToCondoMap.set(shift.guardId, condoName);
                    }
                }
            }
        }

        return { unavailableGuardIds, guardToCondoMap };
    }, [date, turno, condominio.id, slot, plannedShifts, condominios]);


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar Guardia</DialogTitle>
                    <DialogDescription>
                        Asignando turno <strong>{turno}</strong> para el <strong>{format(date, 'PPP', { locale: es })}</strong> en <strong>{condominio.name}</strong> (Espacio {slot}).
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ScrollArea className="h-72 w-full pr-4">
                        <div className="space-y-2">
                            {guards.map(guard => {
                                const isUnavailable = unavailableGuardIds.has(guard.id);
                                const busyAt = guardToCondoMap.get(guard.id);

                                return (
                                    <button
                                        key={guard.id}
                                        onClick={() => onAssign(guard.id)}
                                        disabled={isUnavailable}
                                        className={`w-full text-left p-2 rounded-md flex items-center gap-3 transition-colors ${
                                            currentGuardId === guard.id 
                                                ? 'bg-primary text-primary-foreground' 
                                                : isUnavailable 
                                                    ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                                                    : 'hover:bg-muted'
                                        }`}
                                    >
                                        <Avatar>
                                            <AvatarImage src={guard.photoUrl} alt={guard.name} />
                                            <AvatarFallback>{guard.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{guard.name}</span>
                                        {isUnavailable && (
                                            <Badge variant="destructive" className="ml-auto">En {busyAt}</Badge>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    {currentGuardId && (
                        <Button variant="destructive" onClick={onClear}>Dejar Vacante</Button>
                    )}
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
