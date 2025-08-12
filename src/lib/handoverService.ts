
"use server";

import { adminDb } from './firebase';
import type { HandoverNote } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getLatestHandoverNote(condominioId: string): Promise<HandoverNote | null> {
    try {
        const snapshot = await adminDb.collection('handoverNotes')
            .where('condominioId', '==', condominioId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
            
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        const data = doc.data();
        return JSON.parse(JSON.stringify({
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error fetching latest handover note for condo ${condominioId}:`, error);
        return null;
    }
}

export async function addHandoverNote(note: Omit<HandoverNote, 'id' | 'createdAt'>): Promise<HandoverNote | null> {
    try {
        const newDocRef = adminDb.collection('handoverNotes').doc();
        const newNoteData = {
            id: newDocRef.id,
            ...note,
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newNoteData);

        return JSON.parse(JSON.stringify({
            ...newNoteData,
            createdAt: newNoteData.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error adding handover note:", error);
        return null;
    }
}
