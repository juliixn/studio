
"use client";

import { mockVisitorNotifications as initialData } from './data';
import type { VisitorNotification } from './definitions';

const STORAGE_KEY = 'visitorNotifications-v2';

function getFromStorage(): VisitorNotification[] {
    if (typeof window === 'undefined') return initialData;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) {
        console.error(`Error parsing sessionStorage key "${STORAGE_KEY}":`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
}

function saveToStorage(notifications: VisitorNotification[]) {
    if (typeof window !== 'undefined') {
        const sorted = notifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getVisitorNotifications(condominioId?: string, residentId?: string): VisitorNotification[] {
    let all = getFromStorage();
    if (condominioId) {
        all = all.filter(n => n.condominioId === condominioId);
    }
    if (residentId) {
        all = all.filter(n => n.residentId === residentId);
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter out expired notifications on the client side
    return all.filter(n => {
        if (n.status === 'Activa') {
            const createdAt = new Date(n.createdAt);
            return createdAt > twentyFourHoursAgo;
        }
        return true;
    });
}

export function addVisitorNotification(payload: Omit<VisitorNotification, 'id'|'createdAt'|'status'|'residentName'|'address'>): VisitorNotification {
    const all = getFromStorage();
    const newNotification = {
        ...payload,
        id: `vn-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Activa' as const,
        residentName: 'N/A', // These should be looked up if needed
        address: 'N/A',
    };
    saveToStorage([newNotification, ...all]);
    return newNotification;
}

export function updateVisitorNotification(notificationId: string, payload: Partial<VisitorNotification>): VisitorNotification | null {
    const all = getFromStorage();
    const index = all.findIndex(n => n.id === notificationId);
    if (index > -1) {
        all[index] = { ...all[index], ...payload };
        saveToStorage(all);
        return all[index];
    }
    return null;
}
