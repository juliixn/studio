
"use client";

import { mockShiftRecords as initialData } from './data';
import type { ShiftRecord, TurnoInfo, ShiftIncidentType } from './definitions';

const STORAGE_KEY = 'shiftRecords-v4';

function getFromStorage(): ShiftRecord[] {
    if (typeof window === 'undefined') {
        return initialData;
    }
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        // Robust check for stored data
        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${STORAGE_KEY}", re-initializing.`, error);
    }
    // If no valid data, initialize with mock data
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
}

function saveToStorage(records: ShiftRecord[]) {
    if (typeof window !== 'undefined') {
        const sorted = records.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getShiftRecords(guardId?: string): ShiftRecord[] {
    let allRecords = getFromStorage();
    if (guardId) {
        allRecords = allRecords.filter(r => r.guardId === guardId);
    }
    return allRecords;
}

export function getActiveShiftForGuard(guardId: string): ShiftRecord | null {
    const allRecords = getFromStorage();
    const activeShift = allRecords.find(r => r.guardId === guardId && !r.endTime);
    return activeShift || null;
}

export function getActiveShifts(condominioId?: string): ShiftRecord[] {
    const allRecords = getFromStorage();
    let activeShifts = allRecords.filter(r => !r.endTime);
    if(condominioId) {
        activeShifts = activeShifts.filter(s => s.condominioId === condominioId);
    }
    return activeShifts;
}


export function startShift(guardId: string, guardName: string, turnoInfo: TurnoInfo): ShiftRecord {
    const allRecords = getFromStorage();
    const newRecord: ShiftRecord = {
        id: `shift-${Date.now()}`,
        guardId,
        guardName,
        condominioId: turnoInfo.condominioId,
        condominioName: turnoInfo.condominioName,
        turno: turnoInfo.turno,
        startTime: new Date().toISOString(),
        equipmentIds: turnoInfo.equipmentIds,
    };
    const updatedRecords = [newRecord, ...allRecords];
    saveToStorage(updatedRecords);
    return newRecord;
}

export function endShift(shiftId: string, handoverNotes?: string): ShiftRecord | null {
    const allRecords = getFromStorage();
    const index = allRecords.findIndex(r => r.id === shiftId);
    if (index !== -1) {
        allRecords[index].endTime = new Date().toISOString();
        if (handoverNotes && handoverNotes.trim()) {
            allRecords[index].handoverNotes = handoverNotes;
        }
        saveToStorage(allRecords);
        return allRecords[index];
    }
    return null;
}

export function updateShiftIncident(shiftId: string, incident: ShiftIncidentType | null): ShiftRecord | null {
    const allRecords = getFromStorage();
    const index = allRecords.findIndex(r => r.id === shiftId);
    if (index !== -1) {
        allRecords[index].incident = incident;
        saveToStorage(allRecords);
        return allRecords[index];
    }
    return null;
}
