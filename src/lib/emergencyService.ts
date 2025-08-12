
"use server";

import { adminDb } from './firebase';
import type { EmergencyContact } from './definitions';

export async function getEmergencyContacts(condominioId?: string): Promise<EmergencyContact[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('emergencyContacts');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyContact));
        return JSON.parse(JSON.stringify(contacts));
    } catch (error) {
        console.error("Error fetching emergency contacts:", error);
        return [];
    }
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact | null> {
    try {
        const newDocRef = adminDb.collection('emergencyContacts').doc();
        const newContact = { id: newDocRef.id, ...contact };
        await newDocRef.set(newContact);
        return JSON.parse(JSON.stringify(newContact));
    } catch (error) {
        console.error("Error adding emergency contact:", error);
        return null;
    }
}

export async function updateEmergencyContact(contactId: string, updates: Partial<Omit<EmergencyContact, 'id'>>): Promise<EmergencyContact | null> {
    try {
        const docRef = adminDb.collection('emergencyContacts').doc(contactId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating emergency contact ${contactId}:`, error);
        return null;
    }
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
    try {
        await adminDb.collection('emergencyContacts').doc(contactId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting emergency contact ${contactId}:`, error);
        return false;
    }
}
