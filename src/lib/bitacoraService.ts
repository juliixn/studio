
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
        return JSON.parse(JSON.stringify(entries));
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
        const newEntry = await prisma.bitacoraEntry.create({
            data: payload
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
        const updatedEntry = await prisma.bitacoraEntry.update({
            where: { id: entryId },
            data: {
                ...payload,
                updatedAt: new Date(),
            }
        });
        return JSON.parse(JSON.stringify(updatedEntry));
    } catch (error) {
        console.error("Error updating bitacora entry:", error);
        return null;
    }
}
