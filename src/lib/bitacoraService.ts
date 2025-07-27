"use server";

import prisma from './prisma';
import type { BitacoraEntry, BitacoraEntryType } from './definitions';

export async function getBitacora(condominioId?: string): Promise<BitacoraEntry[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }

        const entries = await prisma.bitacoraEntry.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        // Convert photos from string to array
        const processedEntries = entries.map(entry => ({
            ...entry,
            photos: entry.photos ? entry.photos.split(',') : [],
        }));

        return JSON.parse(JSON.stringify(processedEntries));
    } catch (error) {
        console.error("Error fetching bitacora entries:", error);
        return [];
    }
}

interface NewEntryPayload {
    condominioId: string;
    authorId: string;
    authorName: string;
    type: BitacoraEntryType;
    text: string;
    relatedId?: string;
    photos?: string[];
    category?: string;
    latitude?: number;
    longitude?: number;
}

export async function addBitacoraEntry(payload: NewEntryPayload): Promise<BitacoraEntry | null> {
    try {
        const dataToSave: any = {
            ...payload,
            photos: Array.isArray(payload.photos) ? payload.photos.join(',') : undefined,
        };

        const newEntry = await prisma.bitacoraEntry.create({
            data: dataToSave
        });
        return JSON.parse(JSON.stringify(newEntry));
    } catch (error) {
        console.error("Error adding bitacora entry:", error);
        return null;
    }
}

interface UpdateEntryPayload {
    text: string;
    photos: string[];
}

export async function updateBitacoraEntry(entryId: string, payload: UpdateEntryPayload): Promise<BitacoraEntry | null> {
     try {
        const dataToUpdate: any = {
            ...payload,
            photos: Array.isArray(payload.photos) ? payload.photos.join(',') : undefined,
            updatedAt: new Date(),
        };

        const updatedEntry = await prisma.bitacoraEntry.update({
            where: { id: entryId },
            data: dataToUpdate
        });
        return JSON.parse(JSON.stringify(updatedEntry));
    } catch (error) {
        console.error("Error updating bitacora entry:", error);
        return null;
    }
}
