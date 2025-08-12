
"use server";

import { adminDb } from './firebase';
import type { CommunityEvent } from './definitions';

export async function getEvents(condominioId?: string): Promise<CommunityEvent[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('communityEvents');
        if (condominioId) {
            // This is tricky in Firestore. A better data model would help.
            // For now, we fetch ALL events and filter in memory, which is not scalable.
        }

        const snapshot = await query.orderBy('start', 'asc').get();
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
        
        const filteredEvents = condominioId 
            ? events.filter(e => e.condominioId === 'all' || e.condominioId === condominioId) 
            : events;
            
        return JSON.parse(JSON.stringify(filteredEvents));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function addEvent(event: Omit<CommunityEvent, 'id'>): Promise<CommunityEvent | null> {
    try {
        const newDocRef = adminDb.collection('communityEvents').doc();
        const newEvent = { id: newDocRef.id, ...event };
        await newDocRef.set(newEvent);
        return JSON.parse(JSON.stringify(newEvent));
    } catch (error) {
        console.error("Error adding event:", error);
        return null;
    }
}

export async function updateEvent(eventId: string, updates: Partial<Omit<CommunityEvent, 'id'>>): Promise<CommunityEvent | null> {
    try {
        const docRef = adminDb.collection('communityEvents').doc(eventId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating event ${eventId}:`, error);
        return null;
    }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    try {
        await adminDb.collection('communityEvents').doc(eventId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error);
        return false;
    }
}
