
"use server";

import prisma from './prisma';
import type { HandoverNote } from './definitions';

export async function getLatestHandoverNote(condominioId: string): Promise<HandoverNote | null> {
    try {
        const note = await prisma.handoverNote.findFirst({
            where: { condominioId },
            orderBy: { createdAt: 'desc' },
        });
        return note ? JSON.parse(JSON.stringify(note)) : null;
    } catch (error) {
        console.error(`Error fetching latest handover note for condo ${condominioId}:`, error);
        return null;
    }
}

export async function addHandoverNote(note: Omit<HandoverNote, 'id' | 'createdAt'>): Promise<HandoverNote | null> {
    try {
        const newNote = await prisma.handoverNote.create({
            data: note,
        });
        return JSON.parse(JSON.stringify(newNote));
    } catch (error) {
        console.error("Error adding handover note:", error);
        return null;
    }
}
