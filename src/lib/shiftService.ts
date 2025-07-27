
"use server";

import prisma from './prisma';
import type { ShiftRecord, TurnoInfo, ShiftIncidentType } from './definitions';

export async function getShiftRecords(guardId?: string): Promise<ShiftRecord[]> {
    try {
        const whereClause: any = {};
        if (guardId) {
            whereClause.guardId = guardId;
        }
        const records = await prisma.shiftRecord.findMany({
            where: whereClause,
            orderBy: { startTime: 'desc' },
        });
        const processedRecords = records.map(record => ({
            ...record,
            equipmentIds: record.equipmentIds ? record.equipmentIds.split(',') : [],
        }));
        return JSON.parse(JSON.stringify(processedRecords));
    } catch (error) {
        console.error("Error fetching shift records:", error);
        return [];
    }
}

export async function getActiveShiftForGuard(guardId: string): Promise<ShiftRecord | null> {
    try {
        const activeShift = await prisma.shiftRecord.findFirst({
            where: {
                guardId: guardId,
                endTime: null,
            },
        });
        if (!activeShift) return null;
        
        const processedShift = {
            ...activeShift,
            equipmentIds: activeShift.equipmentIds ? activeShift.equipmentIds.split(',') : [],
        };
        return activeShift ? JSON.parse(JSON.stringify(processedShift)) : null;
    } catch (error) {
        console.error(`Error fetching active shift for guard ${guardId}:`, error);
        return null;
    }
}

export async function getActiveShifts(condominioId?: string): Promise<ShiftRecord[]> {
    try {
        const whereClause: any = { endTime: null };
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const activeShifts = await prisma.shiftRecord.findMany({
            where: whereClause,
        });
        const processedShifts = activeShifts.map(shift => ({
            ...shift,
            equipmentIds: shift.equipmentIds ? shift.equipmentIds.split(',') : [],
        }));
        return JSON.parse(JSON.stringify(processedShifts));
    } catch (error) {
        console.error("Error fetching active shifts:", error);
        return [];
    }
}

export async function startShift(guardId: string, guardName: string, turnoInfo: TurnoInfo): Promise<ShiftRecord | null> {
    try {
        const dataToSave: any = {
            guardId,
            guardName,
            condominioId: turnoInfo.condominioId,
            condominioName: turnoInfo.condominioName,
            turno: turnoInfo.turno,
            equipmentIds: turnoInfo.equipmentIds ? turnoInfo.equipmentIds : undefined,
            startTime: new Date(),
        }
        const newRecord = await prisma.shiftRecord.create({
            data: dataToSave,
        });
        return JSON.parse(JSON.stringify(newRecord));
    } catch (error) {
        console.error("Error starting shift:", error);
        return null;
    }
}

export async function endShift(shiftId: string, handoverNotes?: string): Promise<ShiftRecord | null> {
    try {
        const dataToUpdate: { endTime: Date; handoverNotes?: string } = {
            endTime: new Date(),
        };
        if (handoverNotes && handoverNotes.trim()) {
            dataToUpdate.handoverNotes = handoverNotes;
        }
        const updatedRecord = await prisma.shiftRecord.update({
            where: { id: shiftId },
            data: dataToUpdate,
        });
        return JSON.parse(JSON.stringify(updatedRecord));
    } catch (error) {
        console.error(`Error ending shift ${shiftId}:`, error);
        return null;
    }
}

export async function updateShiftIncident(shiftId: string, incident: ShiftIncidentType | null): Promise<ShiftRecord | null> {
    try {
        const updatedRecord = await prisma.shiftRecord.update({
            where: { id: shiftId },
            data: { incident },
        });
        return JSON.parse(JSON.stringify(updatedRecord));
    } catch (error) {
        console.error(`Error updating shift incident for ${shiftId}:`, error);
        return null;
    }
}
