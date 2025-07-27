
"use client";

import { mockAlertResponses as initialData } from './data';
import type { AlertResponse } from './definitions';

const STORAGE_KEY = 'alertResponses-v5';

function getFromStorage(): AlertResponse[] {
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

function saveToStorage(responses: AlertResponse[]) {
    if (typeof window !== 'undefined') {
        const sorted = responses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getAlertResponses(condominioId?: string): AlertResponse[] {
    let allResponses = getFromStorage();
    if (condominioId) {
        allResponses = allResponses.filter(r => r.condominioId === condominioId);
    }
    return allResponses;
}

type AddAlertResponsePayload = Omit<AlertResponse, 'id' | 'createdAt'>;

export function addAlertResponse(payload: AddAlertResponsePayload): AlertResponse {
    const allResponses = getFromStorage();
    const newResponse: AlertResponse = {
        ...payload,
        id: `alert${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    const updatedResponses = [newResponse, ...allResponses];
    saveToStorage(updatedResponses);
    return newResponse;
}
