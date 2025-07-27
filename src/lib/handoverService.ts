
"use client";

import { mockHandoverNotes as initialData } from './data';
import type { HandoverNote } from './definitions';

const STORAGE_KEY = 'handoverNotes-v1';

function getFromStorage(): HandoverNote[] {
    if (typeof window === 'undefined') {
        return initialData;
    }
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error(`Failed to parse from sessionStorage key "${STORAGE_KEY}", re-initializing.`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
}

function saveToStorage(notes: HandoverNote[]) {
    if (typeof window !== 'undefined') {
        const sorted = notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getLatestHandoverNote(condominioId: string): HandoverNote | undefined {
    const allNotes = getFromStorage();
    const condoNotes = allNotes.filter(n => n.condominioId === condominioId);
    return condoNotes[0]; // Already sorted descending by date
}

export function addHandoverNote(note: Omit<HandoverNote, 'id' | 'createdAt'>): HandoverNote {
    const allNotes = getFromStorage();
    const newNote: HandoverNote = {
        ...note,
        id: `h-note${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...allNotes];
    saveToStorage(updatedNotes);
    return newNote;
}
