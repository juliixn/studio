
"use server";

import { adminDb } from './firebase';
import type { BitacoraEntry, BitacoraEntryType } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

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
        const newEntryRef = adminDb.collection('bitacora').doc();
        const entryData = {
            id: newEntryRef.id,
            createdAt: Timestamp.now(),
            ...payload
        };
        await newEntryRef.set(entryData);
        return JSON.parse(JSON.stringify(entryData));
    } catch (error) {
        console.error("Error adding bitacora entry:", error);
        return null;
    }
}

export async function getBitacora(condominioId?: string): Promise<BitacoraEntry[]> {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('bitacora');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const entries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : undefined,
            } as BitacoraEntry;
        });
        return JSON.parse(JSON.stringify(entries));
    } catch (error) {
        console.error("Error fetching bitacora entries:", error);
        return [];
    }
}

interface UpdateEntryPayload {
    text: string;
    photos: string[];
}

export async function updateBitacoraEntry(entryId: string, payload: UpdateEntryPayload): Promise<BitacoraEntry | null> {
     try {
        const entryRef = adminDb.collection('bitacora').doc(entryId);
        const dataToUpdate = {
            ...payload,
            updatedAt: Timestamp.now()
        };
        await entryRef.update(dataToUpdate);
        const updatedDoc = await entryRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error("Error updating bitacora entry:", error);
        return null;
    }
}
