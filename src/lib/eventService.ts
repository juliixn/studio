
"use client";

import prisma from './prisma';
import type { CommunityEvent } from './definitions';
import { mockEvents } from './data';

const STORAGE_KEY = 'events-v1';

function getFromStorage(): CommunityEvent[] {
    if (typeof window === 'undefined') return mockEvents;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) {
        console.error(`Error parsing sessionStorage key "${STORAGE_KEY}":`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mockEvents));
    return mockEvents;
}

function saveToStorage(events: CommunityEvent[]) {
    if (typeof window !== 'undefined') {
        const sorted = events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}


export function getEvents(condominioId?: string): CommunityEvent[] {
    let events = getFromStorage();
    if (condominioId) {
        events = events.filter(e => e.condominioId === 'all' || e.condominioId === condominioId);
    }
    return events;
}

export function addEvent(event: Omit<CommunityEvent, 'id'>): CommunityEvent {
    const events = getFromStorage();
    const newEvent: CommunityEvent = { ...event, id: `evt-${Date.now()}` };
    saveToStorage([...events, newEvent]);
    return newEvent;
}

export function updateEvent(eventId: string, updates: Partial<Omit<CommunityEvent, 'id'>>): CommunityEvent | null {
    const events = getFromStorage();
    const index = events.findIndex(e => e.id === eventId);
    if (index !== -1) {
        events[index] = { ...events[index], ...updates };
        saveToStorage(events);
        return events[index];
    }
    return null;
}

export function deleteEvent(eventId: string): boolean {
    const events = getFromStorage();
    const newEvents = events.filter(e => e.id !== eventId);
    if (events.length === newEvents.length) return false;
    saveToStorage(newEvents);
    return true;
}
