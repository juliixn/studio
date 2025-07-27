

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
import { getShiftRecords, updateShiftIncident } from "@/lib/shiftService";
import type { ShiftRecord, User, ShiftIncidentType } from "@/lib/definitions";
import { format } from 'date-fns/format';
import { getDaysInMonth } from 'date-fns/getDaysInMonth';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { addMonths } from 'date-fns/addMonths';
import { subMonths } from 'date-fns/subMonths';
import { getHours } from 'date-fns/getHours';
import { getMinutes } from 'date-fns/getMinutes';
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Clock, ChevronLeft, ChevronRight, X, Calendar, Coffee, Plus, DollarSign, Ban, Briefcase, MinusCircle, UserCheck, Loader2 } from "lucide-react";
import { cn, getDistanceInMeters } from "@/lib/utils";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { getUsers } from "@/lib/userService";
import { getCondominios } from "@/lib/condominioService";


// --- Lateness Logic ---
const LATE_GRACE_PERIOD_MINUTES = 15;
const DIURNO_START_HOUR = 7;
const NOCTURNO_START_HOUR = 19;

function isLate(shift: ShiftRecord, allShifts: ShiftRecord[]): boolean {
    if (shift.turno === 'Apoyo') return false;

    const startTime = new Date(shift.startTime);
    const hour = getHours(startTime);
    const minute = getMinutes(startTime);

    if (shift.turno === 'Diurno') {
        return hour > DIURNO_START_HOUR || (hour === DIURNO_START_HOUR && minute > LATE_GRACE_PERIOD_MINUTES);
    }
    if (shift.turno === 'Nocturno') {
        return hour > NOCTURNO_START_HOUR || (hour === NOCTURNO_START_HOUR && minute > LATE_GRACE_PERIOD_MINUTES);
    }
    return false;
}

const incidentTypes: { type: ShiftIncidentType; label: string; icon: React.ReactElement; color?: string }[] = [
    { type: 'Falta', label: 'Falta', icon: <X className="h-4 w-4" />, color: 'text-red-500' },
    { type: 'Permiso con Goce', label: 'Permiso c/ Goce', icon: <Calendar className="h-4 w-4" />, color: 'text-blue-500' },
    { type: 'Permiso sin Goce', label: 'Permiso s/ Goce', icon: <Calendar className="h-4 w-4" />, color: 'text-gray-500' },
    { type: 'Enfermedad General', label: 'Enfermedad', icon: <Briefcase className="h-4 w-4" />, color: 'text-orange-500' },
    { type: 'Incapacidad', label: 'Incapacidad', icon: <Ban className="h-4 w-4" />, color: 'text-purple-500' },
    { type: 'Vacaciones', label: 'Vacaciones', icon: <Coffee className="h-4 w-4" />, color: 'text-teal-500' },
    { type: 'Adelanto de Turno', label: 'Adelanto Turno', icon: <Plus className="h-4 w-4" /> },
    { type: 'Doble Turno', label: 'Doble Turno', icon: <Plus className="h-4 w-4" />, color: 'text-indigo-500' },
    { type: 'Penalización', label: 'Penalización', icon: <DollarSign className="h-4 w-4" /> },
];

// --- Component ---
export default function AsistenciaPage() {
    const { toast } = useToast();
    const [shifts, setShifts] = useState<ShiftRecord[]>([]);
    const [guards, setGuards] = useState<User[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedShift, setSelectedShift] = useState<ShiftRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshData = async () => {
        setIsLoading(true);
        const [shiftsData, guardsData] = await Promise.all([
            getShiftRecords(),
            getUsers()
        ]);
        setShifts(shiftsData);
        setGuards(guardsData.filter(u => u.role === 'Guardia'));
        setIsLoading(false);
    }

    useEffect(() => {
        refreshData();
    }, []);

    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => addMonths(prev, 1));
    };
    
    const handleSetIncident = async (shiftId: string, incident: ShiftIncidentType | null) => {
        await updateShiftIncident(shiftId, incident);
        await refreshData();
        toast({ title: 'Incidencia actualizada' });
    };

    const shiftsByGuardAndDay = useMemo(() => {
        const map = new Map<string, ShiftRecord[]>();
        for (const shift of shifts) {
            const key = `${shift.guardId}-${format(new Date(shift.startTime), 'yyyy-MM-dd')}`;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(shift);
        }
        return map;
    }, [shifts]);

    const renderShiftCell = (guardId: string, day: Date, turno: 'Diurno' | 'Nocturno') => {
        const key = `${guardId}-${format(day, 'yyyy-MM-dd')}`;
        const dayShifts = shiftsByGuardAndDay.get(key);
        const shift = dayShifts?.find(s => s.turno === turno);

        if (!shift) {
            return <TableCell className="text-center p-1 border-l"></TableCell>;
        }
        
        let Icon: React.ReactNode = <UserCheck className="h-5 w-5" />;
        let color = 'text-green-600 hover:text-green-700';

        if (shift.incident) {
            const incidentConfig = incidentTypes.find(i => i.type === shift.incident);
            if (incidentConfig) {
                Icon = incidentConfig.icon;
                color = incidentConfig.color || 'text-gray-600 hover:text-gray-700';
            }
        } else if (isLate(shift, shifts)) {
            Icon = <Clock className="h-5 w-5" />;
            color = 'text-amber-500 hover:text-amber-600';
        }

        return (
            <TableCell className="text-center p-1 border-l">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8", color)}>
                            {Icon}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         <DropdownMenuItem onClick={() => setSelectedShift(shift)}>
                            <Clock className="mr-2 h-4 w-4" /> Ver Detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetIncident(shift.id, null)}>
                            <Check className="mr-2 h-4 w-4" /> Asistencia Normal
                        </DropdownMenuItem>
                        {incidentTypes.map(inc => (
                             <DropdownMenuItem key={inc.type} onClick={() => handleSetIncident(shift.id, inc.type)}>
                                {React.cloneElement(inc.icon, { className: 'mr-2 h-4 w-4' })}
                                <span>{inc.label}</span>
                             </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Control de Asistencia por Calendario</CardTitle>
                            <CardDescription>Visualiza la asistencia y registra incidencias por turno.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-lg font-semibold w-32 text-center capitalize">{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                 <TableRow>
                                    <TableHead rowSpan={2} className="sticky left-0 bg-card z-10 px-4 align-middle">Guardia</TableHead>
                                    {daysInMonth.map(day => (
                                        <TableHead key={day.toString()} colSpan={2} className="text-center w-[120px] border-l capitalize">
                                            {format(day, 'E dd', { locale: es })}
                                        </TableHead>
                                    ))}
                                </TableRow>
                                <TableRow>
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
                                ) : guards.map(guard => (
                                    <TableRow key={guard.id}>
                                        <TableCell className="font-medium sticky left-0 bg-card z-10 px-4">
                                            <div className="flex flex-col leading-tight">
                                                <span>{guard.name.split(' ')[0]}</span>
                                                <span className="text-xs text-muted-foreground">{guard.name.split(' ').slice(1).join(' ')}</span>
                                            </div>
                                        </TableCell>
                                        {daysInMonth.map(day => (
                                            <React.Fragment key={`${guard.id}-${day.toString()}`}>
                                                {renderShiftCell(guard.id, day, 'Diurno')}
                                                {renderShiftCell(guard.id, day, 'Nocturno')}
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle del Turno</DialogTitle>
                        {selectedShift && (
                             <DialogDescription>
                                Detalles de la asistencia para {selectedShift.guardName} el {format(new Date(selectedShift.startTime), 'PPP', { locale: es })}.
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {selectedShift && (
                        <div className="space-y-4 py-4 text-sm">
                           <p><strong>Guardia:</strong> {selectedShift.guardName}</p>
                           <p><strong>Condominio:</strong> {selectedShift.condominioName}</p>
                           <p><strong>Turno:</strong> <Badge variant="outline">{selectedShift.turno}</Badge></p>
                           <p><strong>Hora de Entrada:</strong> {format(new Date(selectedShift.startTime), 'p', { locale: es })}</p>
                           <p><strong>Hora de Salida:</strong> {selectedShift.endTime ? format(new Date(selectedShift.endTime), 'p', { locale: es }) : 'En curso'}</p>
                           <p><strong>Estado:</strong> {isLate(selectedShift, shifts) ? <Badge variant="destructive">Retardo</Badge> : <Badge>Puntual</Badge>}</p>
                           {selectedShift.incident && <p><strong>Incidencia:</strong> <Badge variant="warning">{selectedShift.incident}</Badge></p>}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
