
"use client";

import type { PanicAlert } from './definitions';

const STORAGE_KEY = 'panicAlerts-v1';

function getFromStorage(): PanicAlert[] {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${STORAGE_KEY}", re-initializing.`, error);
    }
    return [];
}

function saveToStorage(alerts: PanicAlert[]) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    }
}

export function getActiveAlerts(): PanicAlert[] {
    return getFromStorage();
}

export function getActiveAlertsForCondo(condominioId: string): PanicAlert[] {
    const allAlerts = getFromStorage();
    return allAlerts.filter(alert => alert.condominioId === condominioId);
}

export function getAlertForCondo(condominioId: string): PanicAlert | null {
    const alertsForCondo = getActiveAlertsForCondo(condominioId);
    return alertsForCondo.length > 0 ? alertsForCondo[0] : null;
}

type CreateAlertPayload = Omit<PanicAlert, 'id' | 'createdAt'>;

export function createPanicAlert(payload: CreateAlertPayload): PanicAlert {
    const allAlerts = getFromStorage();
    
    // Prevent creating duplicate alerts for the same condo
    const existingAlert = allAlerts.find(a => a.condominioId === payload.condominioId);
    if (existingAlert) {
        return existingAlert;
    }

    const newAlert: PanicAlert = {
        ...payload,
        id: `panic-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };

    saveToStorage([...allAlerts, newAlert]);
    return newAlert;
}

export function clearPanicAlert(alertId: string): void {
    const allAlerts = getFromStorage();
    const updatedAlerts = allAlerts.filter(a => a.id !== alertId);
    saveToStorage(updatedAlerts);
}
