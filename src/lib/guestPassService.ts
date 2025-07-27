

"use client";

import { mockGuestPasses as initialPasses } from './data';
import type { GuestPass } from './definitions';
import { addDays, addMonths, addYears } from 'date-fns';

const STORAGE_KEY = 'guestPasses-v5';

function getFromStorage(): GuestPass[] {
    if (typeof window === 'undefined') {
        return initialPasses;
    }
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${STORAGE_KEY}", re-initializing.`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialPasses));
    return initialPasses;
}

function saveToStorage(passes: GuestPass[]) {
    if (typeof window !== 'undefined') {
        const sorted = passes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getGuestPasses(condominioId?: string, residentId?: string): GuestPass[] {
    let allPasses = getFromStorage();
    
    if (condominioId) {
        allPasses = allPasses.filter(p => p.condominioId === condominioId);
    }

    if (residentId) {
        allPasses = allPasses.filter(p => p.residentId === residentId);
    }

    return allPasses;
}

export function getGuestPassById(passId: string): GuestPass | undefined {
    const allPasses = getFromStorage();
    const pass = allPasses.find(p => p.id === passId);

    // Case 1: Pass does not exist at all.
    if (!pass) {
        console.error(`[getGuestPassById] Pass with ID ${passId} not found.`);
        return undefined;
    }

    // Case 2: Pass is permanent. It's always valid.
    if (pass.passType === 'permanent') {
        return pass;
    }

    // Case 3: Pass is temporal. We must check the expiration date.
    if (pass.passType === 'temporal') {
        // Subcase 3a: Temporal pass is missing an expiration date. This is an invalid state.
        if (!pass.validUntil) {
            console.error(`[getGuestPassById] Temporal pass ${passId} is missing an expiration date.`);
            return undefined;
        }

        // Subcase 3b: Check if the current date is at or after the expiration date.
        const isExpired = new Date() >= new Date(pass.validUntil);
        if (isExpired) {
            console.warn(`[getGuestPassById] Pass ${passId} is expired. Valid until: ${pass.validUntil}`);
            return undefined;
        }

        // If not expired, it's valid.
        return pass;
    }
    
    // Case 4: The pass has an unknown passType. Treat as invalid.
    console.error(`[getGuestPassById] Pass ${passId} has an unknown passType: ${pass.passType}`);
    return undefined;
}

type AddPassPayload = Omit<GuestPass, 'id' | 'createdAt' | 'validUntil'> & {
    durationValue?: number;
    durationUnit?: 'days' | 'months' | 'years';
};

export function addGuestPass(payload: AddPassPayload): GuestPass {
    const allPasses = getFromStorage();
    
    let validUntil: string | null = null;
    if (payload.passType === 'temporal' && payload.durationValue && payload.durationUnit) {
        const now = new Date();
        switch (payload.durationUnit) {
            case 'days':
                validUntil = addDays(now, payload.durationValue).toISOString();
                break;
            case 'months':
                validUntil = addMonths(now, payload.durationValue).toISOString();
                break;
            case 'years':
                validUntil = addYears(now, payload.durationValue).toISOString();
                break;
        }
    }

    const newPass: GuestPass = {
        ...payload,
        id: `gp${Date.now()}`,
        createdAt: new Date().toISOString(),
        validUntil: validUntil,
    };
    
    const updatedPasses = [newPass, ...allPasses];
    saveToStorage(updatedPasses);
    return newPass;
}

export function deleteGuestPass(passId: string) {
    const allPasses = getFromStorage();
    const updatedPasses = allPasses.filter(p => p.id !== passId);
    saveToStorage(updatedPasses);
}
