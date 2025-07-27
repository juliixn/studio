
"use server";

import prisma from './prisma';
import type { PlannedShift } from './definitions';

export async function getPlannedShifts(): Promise<PlannedShift[]> {
    try {
        const shifts = await prisma.plannedShift.findMany();
        return JSON.parse(JSON.stringify(shifts));
    } catch (error) {
        console.error("Error fetching planned shifts:", error);
        return [];
    }
}

type AddOrUpdatePayload = Omit<PlannedShift, 'id'>;

export async function addOrUpdatePlannedShift(payload: AddOrUpdatePayload): Promise<PlannedShift | null> {
    try {
        const id = `${payload.condominioId}-${payload.date}-${payload.turno}-${payload.slot}`;
        const newShift: PlannedShift = { ...payload, id };
        
        const upsertedShift = await prisma.plannedShift.upsert({
            where: { id },
            update: { guardId: newShift.guardId },
            create: newShift,
        });
        return JSON.parse(JSON.stringify(upsertedShift));
    } catch (error) {
        console.error("Error adding or updating planned shift:", error);
        return null;
    }
}

export async function removePlannedShift(shiftId: string): Promise<boolean> {
    try {
        await prisma.plannedShift.delete({
            where: { id: shiftId },
        });
        return true;
    } catch (error) {
        console.error(`Error removing planned shift ${shiftId}:`, error);
        return false;
    }
}
