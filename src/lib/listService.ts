
"use server";

import prisma from './prisma';

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

// This service now interacts with Prisma instead of localStorage

export async function getList(key: ListKey): Promise<string[]> {
    try {
        const list = await prisma.list.findUnique({
            where: { key },
        });
        return list ? list.values : [];
    } catch (error) {
        console.error(`Error fetching list "${key}":`, error);
        return [];
    }
}

export async function updateList(key: ListKey, newList: string[]): Promise<void> {
    try {
        const sortedList = newList.sort();
        await prisma.list.upsert({
            where: { key },
            update: { values: sortedList },
            create: { key, values: sortedList },
        });
    } catch (error) {
        console.error(`Error updating list "${key}":`, error);
    }
}
