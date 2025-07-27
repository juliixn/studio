
"use client";

import { mockVehicularRegistrations as initialVehicular, mockPedestrianRegistrations as initialPedestrian } from './data';
import type { VehicularRegistration, PedestrianRegistration } from './definitions';

const VEHICULAR_KEY = 'vehicularRegistrations-v4';
const PEDESTRIAN_KEY = 'pedestrianRegistrations-v4';

// --- Vehicular Registrations ---
function getVehicularFromStorage(): VehicularRegistration[] {
    if (typeof window === 'undefined') return initialVehicular;
    try {
        const stored = sessionStorage.getItem(VEHICULAR_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) { console.error(`Error parsing sessionStorage key "${VEHICULAR_KEY}":`, error); }
    sessionStorage.setItem(VEHICULAR_KEY, JSON.stringify(initialVehicular));
    return initialVehicular;
}

function saveVehicularToStorage(registrations: VehicularRegistration[]) {
    if (typeof window !== 'undefined') {
        const sorted = registrations.sort((a,b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
        sessionStorage.setItem(VEHICULAR_KEY, JSON.stringify(sorted));
    }
}

export function getVehicularRegistrations(condominioId?: string): VehicularRegistration[] {
    let all = getVehicularFromStorage();
    return condominioId ? all.filter(r => r.condominioId === condominioId) : all;
}

export function addVehicularRegistration(reg: Omit<VehicularRegistration, 'id' | 'entryTimestamp'>): VehicularRegistration {
    const all = getVehicularFromStorage();
    const newReg = { ...reg, id: `vr-${Date.now()}`, entryTimestamp: new Date().toISOString() };
    saveVehicularToStorage([newReg, ...all]);
    return newReg;
}

export function updateVehicularExit(id: string): VehicularRegistration | null {
    const all = getVehicularFromStorage();
    const index = all.findIndex(r => r.id === id);
    if (index > -1) {
        all[index].exitTimestamp = new Date().toISOString();
        saveVehicularToStorage(all);
        return all[index];
    }
    return null;
}

// --- Pedestrian Registrations ---
function getPedestrianFromStorage(): PedestrianRegistration[] {
    if (typeof window === 'undefined') return initialPedestrian;
    try {
        const stored = sessionStorage.getItem(PEDESTRIAN_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) { console.error(`Error parsing sessionStorage key "${PEDESTRIAN_KEY}":`, error); }
    sessionStorage.setItem(PEDESTRIAN_KEY, JSON.stringify(initialPedestrian));
    return initialPedestrian;
}

function savePedestrianToStorage(registrations: PedestrianRegistration[]) {
     if (typeof window !== 'undefined') {
        const sorted = registrations.sort((a,b) => new Date(b.entryTimestamp).getTime() - new Date(a.entryTimestamp).getTime());
        sessionStorage.setItem(PEDESTRIAN_KEY, JSON.stringify(sorted));
    }
}

export function getPedestrianRegistrations(condominioId?: string): PedestrianRegistration[] {
    let all = getPedestrianFromStorage();
    return condominioId ? all.filter(r => r.condominioId === condominioId) : all;
}

export function addPedestrianRegistration(reg: Omit<PedestrianRegistration, 'id' | 'entryTimestamp'>): PedestrianRegistration {
    const all = getPedestrianFromStorage();
    const newReg = { ...reg, id: `pr-${Date.now()}`, entryTimestamp: new Date().toISOString() };
    savePedestrianToStorage([newReg, ...all]);
    return newReg;
}

export function updatePedestrianExit(id: string): PedestrianRegistration | null {
    const all = getPedestrianFromStorage();
    const index = all.findIndex(r => r.id === id);
    if (index > -1) {
        all[index].exitTimestamp = new Date().toISOString();
        savePedestrianToStorage(all);
        return all[index];
    }
    return null;
}
