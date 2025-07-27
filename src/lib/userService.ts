
"use client";

import { mockUsers as initialData } from './data';
import type { User } from './definitions';
import prisma from './prisma';

const STORAGE_KEY = 'users-v4';

// --- Local Storage Functions (for client-side simulation) ---

function getFromStorage(): User[] {
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

function saveToStorage(users: User[]) {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
}

// --- Public API ---

// This function now acts as a client-side accessor.
// For server-side operations, use Prisma directly.
export function getUsers(): User[] {
    return getFromStorage();
}

export function getUserById(userId: string): User | undefined {
    return getFromStorage().find(u => u.id === userId);
}

export function addUser(userData: Partial<User>): User {
    const allUsers = getFromStorage();
    const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username || '',
        name: userData.name || '',
        email: userData.email || '',
        password: userData.password || 'password123',
        role: userData.role || 'Propietario',
        ...userData,
    };
    const updatedUsers = [...allUsers, newUser];
    saveToStorage(updatedUsers);
    return newUser;
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
    const allUsers = getFromStorage();
    const index = allUsers.findIndex(u => u.id === userId);
    if (index > -1) {
        allUsers[index] = { ...allUsers[index], ...updates };
        saveToStorage(allUsers);
        return allUsers[index];
    }
    return null;
}

export function deleteUser(userId: string): boolean {
    const allUsers = getFromStorage();
    const newLength = allUsers.length;
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    if (updatedUsers.length < newLength) {
        saveToStorage(updatedUsers);
        return true;
    }
    return false;
}
