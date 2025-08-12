
"use server";

import { adminDb } from './firebase';
import type { PlannedShift } from './definitions';

export async function getPlannedShifts(): Promise<PlannedShift[]> {
    try {
        const snapshot = await adminDb.collection('plannedShifts').get();
        const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannedShift));
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
        
        await adminDb.collection('plannedShifts').doc(id).set(newShift, { merge: true });
        return JSON.parse(JSON.stringify(newShift));
    } catch (error) {
        console.error("Error adding or updating planned shift:", error);
        return null;
    }
}

export async function removePlannedShift(shiftId: string): Promise<boolean> {
    try {
        await adminDb.collection('plannedShifts').doc(shiftId).delete();
        return true;
    } catch (error) {
        console.error(`Error removing planned shift ${shiftId}:`, error);
        return false;
    }
}
