
"use client";

import { mockReservations as initialReservations, mockCommonAreas as initialAreas } from './data';
import type { Reservation, ReservationStatus, CommonArea } from './definitions';

const RESERVATION_KEY = 'reservations-v5';
const AREA_KEY = 'commonAreas-v5';

// Common Area Service
function getAreasFromStorage(): CommonArea[] {
    if (typeof window === 'undefined') return initialAreas;
    try {
        const stored = sessionStorage.getItem(AREA_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${AREA_KEY}", re-initializing.`, error);
    }
    sessionStorage.setItem(AREA_KEY, JSON.stringify(initialAreas));
    return initialAreas;
}

function saveAreasToStorage(areas: CommonArea[]) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(AREA_KEY, JSON.stringify(areas));
    }
}

export function getCommonAreas(condominioId?: string): CommonArea[] {
    const areas = getAreasFromStorage();
    return condominioId ? areas.filter(a => a.condominioId === condominioId) : areas;
}

export function addCommonArea(area: Omit<CommonArea, 'id'>): CommonArea {
    const areas = getAreasFromStorage();
    const newArea: CommonArea = { ...area, id: `ca${Date.now()}` };
    saveAreasToStorage([newArea, ...areas]);
    return newArea;
}

export function updateCommonArea(areaId: string, payload: Partial<Omit<CommonArea, 'id'>>) {
    const areas = getAreasFromStorage();
    const index = areas.findIndex(a => a.id === areaId);
    if (index !== -1) {
        areas[index] = { ...areas[index], ...payload };
        saveAreasToStorage(areas);
    }
}

export function deleteCommonArea(areaId: string) {
    const areas = getAreasFromStorage();
    saveAreasToStorage(areas.filter(a => a.id !== areaId));
}

// Reservation Service
function getReservationsFromStorage(): Reservation[] {
    if (typeof window === 'undefined') return initialReservations;
    try {
        const stored = sessionStorage.getItem(RESERVATION_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${RESERVATION_KEY}", re-initializing.`, error);
    }
    sessionStorage.setItem(RESERVATION_KEY, JSON.stringify(initialReservations));
    return initialReservations;
}

function saveReservationsToStorage(reservations: Reservation[]) {
    if (typeof window !== 'undefined') {
        const sorted = reservations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(RESERVATION_KEY, JSON.stringify(sorted));
    }
}

export function getReservations(condominioId?: string, userId?: string): Reservation[] {
    let reservations = getReservationsFromStorage();
    if (condominioId) {
        reservations = reservations.filter(r => r.condominioId === condominioId);
    }
    if (userId) {
        reservations = reservations.filter(r => r.userId === userId);
    }
    return reservations;
}

export function addReservation(res: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Reservation {
    const reservations = getReservationsFromStorage();
    const newReservation: Reservation = {
        ...res,
        id: `res${Date.now()}`,
        status: 'Pendiente',
        createdAt: new Date().toISOString(),
    };
    saveReservationsToStorage([newReservation, ...reservations]);
    return newReservation;
}

export function updateReservationStatus(reservationId: string, status: ReservationStatus) {
    const reservations = getReservationsFromStorage();
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index !== -1) {
        reservations[index].status = status;
        saveReservationsToStorage(reservations);
    }
}
