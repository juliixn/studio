

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
import { ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { es } from "date-fns/locale";
import React from "react";
import { getCondominios } from "@/lib/condominioService";
import { getUsers } from "@/lib/userService";
import { getPlannedShifts, addOrUpdatePlannedShift, removePlannedShift } from "@/lib/shiftPlanningService";
import type { PlannedShift, Condominio, User } from "@/lib/definitions";
import ShiftAssignmentDialog from "@/components/admin/shift-assignment-dialog";

type DialogState = {
    isOpen: boolean;
    date: Date | null;
    condominio: Condominio | null;
    turno: 'Diurno' | 'Nocturno' | null;
    slot: number | null;
    currentGuardId: string | null;
}

export default function PlanificadorTurnosPage() {
    const [plannedShifts, setPlannedShifts] = useState<PlannedShift[]>([]);
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [guards, setGuards] = useState<User[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const [dialogState, setDialogState] = useState<DialogState>({
        isOpen: false,
        date: null,
        condominio: null,
        turno: null,
        slot: null,
        currentGuardId: null,
    });

    const refreshData = async () => {
        setIsLoading(true);
        const [condos, guardUsers, shifts] = await Promise.all([
            getCondominios(),
            getUsers(),
            getPlannedShifts()
        ]);
        setCondominios(condos);
        setGuards(guardUsers.filter(u => u.role === 'Guardia'));
        setPlannedShifts(shifts);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    const shiftsByCondoAndDate = useMemo(() => {
        const map = new Map<string, PlannedShift>();
        for (const shift of plannedShifts) {
            const key = `${shift.condominioId}-${shift.date}-${shift.turno}-${shift.slot}`;
            map.set(key, shift);
        }
        return map;
    }, [plannedShifts]);

    const getGuardName = (guardId: string | null) => {
        if (!guardId) return null;
        return guards.find(g => g.id === guardId)?.name.split(' ')[0] || 'N/A';
    };

    const handleOpenDialog = (condominio: Condominio, date: Date, turno: 'Diurno' | 'Nocturno', slot: number) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const key = `${condominio.id}-${dateString}-${turno}-${slot}`;
        const existingShift = shiftsByCondoAndDate.get(key);
        
        setDialogState({
            isOpen: true,
            date,
            condominio,
            turno,
            slot,
            currentGuardId: existingShift?.guardId || null,
        });
    };
    
    const handleAssignGuard = async (guardId: string) => {
        if (!dialogState.date || !dialogState.condominio || !dialogState.turno || dialogState.slot === null) return;
        const dateString = format(dialogState.date, 'yyyy-MM-dd');
        await addOrUpdatePlannedShift({
            date: dateString,
            condominioId: dialogState.condominio.id,
            turno: dialogState.turno,
            slot: dialogState.slot,
            guardId,
        });
        await refreshData();
        setDialogState({ isOpen: false, date: null, condominio: null, turno: null, slot: null, currentGuardId: null });
    };

    const handleClearAssignment = async () => {
        if (!dialogState.date || !dialogState.condominio || !dialogState.turno || dialogState.slot === null) return;
        const dateString = format(dialogState.date, 'yyyy-MM-dd');
        const id = `${dialogState.condominio.id}-${dateString}-${dialogState.turno}-${dialogState.slot}`;
        await removePlannedShift(id);
        await refreshData();
        setDialogState({ isOpen: false, date: null, condominio: null, turno: null, slot: null, currentGuardId: null });
    };

    const renderShiftSlots = (condo: Condominio, day: Date, turno: 'Diurno' | 'Nocturno') => {
        const requiredGuards = turno === 'Diurno' ? (condo.guardsRequiredDiurno || 1) : (condo.guardsRequiredNocturno || 1);
        const slots = Array.from({ length: requiredGuards }, (_, i) => i + 1);

        return (
             <TableCell className="p-0.5 border-l">
                <div className="flex items-center justify-center gap-0.5 min-h-[4rem]">
                    {slots.map(slot => {
                        const key = `${condo.id}-${format(day, 'yyyy-MM-dd')}-${turno}-${slot}`;
                        const shift = shiftsByCondoAndDate.get(key);
                        const guardName = shift ? getGuardName(shift.guardId) : null;
                        
                        return (
                            <Button
                                key={key}
                                variant={guardName ? "secondary" : "ghost"}
                                className="h-16 w-full flex-1 text-xs font-semibold px-1 py-0.5 whitespace-normal flex items-center justify-center"
                                onClick={() => handleOpenDialog(condo, day, turno, slot)}
                            >
                                {guardName ? (
                                    <span>{guardName}</span>
                                ) : (
                                    <Plus className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        );
                    })}
                </div>
            </TableCell>
        );
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Planificador de Turnos</CardTitle>
                            <CardDescription>Asigna guardias a los turnos de cada condominio. Define el número de guardias por turno en la sección de Condominios.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-lg font-semibold w-40 text-center capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table className="min-w-[1800px] table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-card z-10 w-[200px] text-sm">Condominio</TableHead>
                                    {daysInMonth.map(day => (
                                        <TableHead key={day.toString()} colSpan={2} className="text-center w-[120px] border-l capitalize font-semibold">
                                            {format(day, 'E dd', { locale: es })}
                                        </TableHead>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-card z-10 w-[200px] top-[50px]"></TableHead>
                                    {daysInMonth.map(day => (
                                        <React.Fragment key={`sub-${day.toString()}`}>
                                            <TableHead className="text-center font-bold border-l p-2 w-[60px]">D</TableHead>
                                            <TableHead className="text-center font-bold border-l p-2 w-[60px]">N</TableHead>
                                        </React.Fragment>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={(daysInMonth.length * 2) + 1} className="h-48 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                                        </TableCell>
                                    </TableRow>
                                ) : condominios.map(condo => (
                                    <TableRow key={condo.id}>
                                        <TableCell className="font-medium sticky left-0 bg-card z-10 w-[200px]">{condo.name}</TableCell>
                                        {daysInMonth.map(day => (
                                            <React.Fragment key={`${condo.id}-${day.toString()}`}>
                                                {renderShiftSlots(condo, day, 'Diurno')}
                                                {renderShiftSlots(condo, day, 'Nocturno')}
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {dialogState.isOpen && (
                <ShiftAssignmentDialog
                    isOpen={dialogState.isOpen}
                    onClose={() => setDialogState({ ...dialogState, isOpen: false })}
                    date={dialogState.date!}
                    condominio={dialogState.condominio!}
                    turno={dialogState.turno!}
                    slot={dialogState.slot!}
                    currentGuardId={dialogState.currentGuardId}
                    guards={guards}
                    condominios={condominios}
                    plannedShifts={plannedShifts}
                    onAssign={handleAssignGuard}
                    onClear={handleClearAssignment}
                />
            )}
        </>
    );
}
