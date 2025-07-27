
"use client";

import prisma from './prisma';
import type { Comunicado } from './definitions';

// For now, using mock data until a proper solution for server/client data fetching is established.
import { mockComunicados } from './data';

const STORAGE_KEY = 'comunicados-v1';

function getFromStorage(): Comunicado[] {
    if (typeof window === 'undefined') return mockComunicados;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) {
        console.error(`Error parsing sessionStorage key "${STORAGE_KEY}":`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockComunicados));
    return mockComunicados;
}

function saveToStorage(comunicados: Comunicado[]) {
    if (typeof window !== 'undefined') {
        const sorted = comunicados.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}


export function getComunicados(condominioId?: string): Comunicado[] {
    const comunicados = getFromStorage();
    if (!condominioId) return comunicados;
    return comunicados.filter(c => c.target === 'all' || c.target === condominioId);
}

export function addComunicado(payload: Omit<Comunicado, 'id' | 'createdAt'>): Comunicado {
    const comunicados = getFromStorage();
    const newComunicado: Comunicado = {
        ...payload,
        id: `com-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    const updated = [newComunicado, ...comunicados];
    saveToStorage(updated);
    return newComunicado;
}
