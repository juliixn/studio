
"use server";

import { adminDb } from './firebase';
import type { ShiftRecord, TurnoInfo, ShiftIncidentType } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function startShift(guardId: string, guardName: string, turnoInfo: TurnoInfo): Promise<ShiftRecord | null> {
    try {
        const newShiftRef = adminDb.collection('shifts').doc();
        const dataToSave = {
            id: newShiftRef.id,
            guardId,
            guardName,
            condominioId: turnoInfo.condominioId,
            condominioName: turnoInfo.condominioName,
            turno: turnoInfo.turno,
            equipmentIds: turnoInfo.equipmentIds || [],
            startTime: Timestamp.now(),
            endTime: null,
        };
        await newShiftRef.set(dataToSave);
        return JSON.parse(JSON.stringify({ ...dataToSave, startTime: new Date().toISOString() }));
    } catch (error) {
        console.error("Error starting shift:", error);
        return null;
    }
}

export async function endShift(shiftId: string, handoverNotes?: string): Promise<ShiftRecord | null> {
    try {
        const shiftRef = adminDb.collection('shifts').doc(shiftId);
        const updateData: { endTime: Timestamp; handoverNotes?: string } = {
            endTime: Timestamp.now(),
        };
        if (handoverNotes && handoverNotes.trim()) {
            updateData.handoverNotes = handoverNotes;
        }
        await shiftRef.update(updateData);
        const updatedDoc = await shiftRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error ending shift ${shiftId}:`, error);
        return null;
    }
}

export async function getActiveShiftForGuard(guardId: string): Promise<ShiftRecord | null> {
    try {
        const snapshot = await adminDb.collection('shifts')
            .where('guardId', '==', guardId)
            .where('endTime', '==', null)
            .limit(1)
            .get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        const data = doc.data();
        return JSON.parse(JSON.stringify({
            ...data,
            startTime: data.startTime.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error fetching active shift for guard ${guardId}:`, error);
        return null;
    }
}

export async function getActiveShifts(condominioId?: string): Promise<ShiftRecord[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('shifts').where('endTime', '==', null);
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.get();
        const shifts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                startTime: data.startTime.toDate().toISOString(),
            } as ShiftRecord;
        });
        return JSON.parse(JSON.stringify(shifts));
    } catch (error) {
        console.error("Error fetching active shifts:", error);
        return [];
    }
}

export async function getShiftRecords(guardId?: string): Promise<ShiftRecord[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('shifts');
        if (guardId) {
            query = query.where('guardId', '==', guardId);
        }
        const snapshot = await query.orderBy('startTime', 'desc').get();
        const records = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                startTime: data.startTime.toDate().toISOString(),
                endTime: data.endTime ? data.endTime.toDate().toISOString() : undefined,
            } as ShiftRecord;
        });
        return JSON.parse(JSON.stringify(records));
    } catch (error) {
        console.error("Error fetching shift records:", error);
        return [];
    }
}

export async function updateShiftIncident(shiftId: string, incident: ShiftIncidentType | null): Promise<ShiftRecord | null> {
    try {
        const shiftRef = adminDb.collection('shifts').doc(shiftId);
        await shiftRef.update({ incident: incident || null });
        const updatedDoc = await shiftRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating shift incident for ${shiftId}:`, error);
        return null;
    }
}
