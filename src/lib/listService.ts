
"use server";

import { adminDb } from './firebase';

export const listKeys = [
    'visitorTypes', 
    'vehicleVisitorTypes', 
    'vehicleTypes', 
    'vehicleBrands', 
    'vehicleColors',
    'equipment',
    'incidentCategories',
    'providerTypes',
    'employeeTypes'
] as const;

export type ListKey = typeof listKeys[number];

export async function getList(key: ListKey): Promise<string[]> {
    try {
        const doc = await adminDb.collection('lists').doc(key).get();
        if (!doc.exists) {
            return [];
        }
        return (doc.data()?.values || []) as string[];
    } catch (error) {
        console.error(`Error fetching list "${key}":`, error);
        return [];
    }
}

export async function updateList(key: ListKey, newList: string[]): Promise<void> {
    try {
        const sortedList = [...new Set(newList)].sort(); // Ensure unique values and sort
        await adminDb.collection('lists').doc(key).set({ key, values: sortedList });
    } catch (error) {
        console.error(`Error updating list "${key}":`, error);
    }
}
