
"use server";

import { adminDb } from './firebase';
import type { Address } from './definitions';

export async function getDomicilios(condominioId?: string): Promise<Address[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('addresses');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('fullAddress').get();
        const domicilios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
        return JSON.parse(JSON.stringify(domicilios));
    } catch (error) {
        console.error("Error fetching domicilios:", error);
        return [];
    }
}

export async function addDomicilio(domicilioData: Omit<Address, 'id'>): Promise<Address | null> {
    try {
        const newDocRef = adminDb.collection('addresses').doc();
        const newDomicilio = {
            id: newDocRef.id,
            ...domicilioData
        };
        await newDocRef.set(newDomicilio);
        return JSON.parse(JSON.stringify(newDomicilio));
    } catch (error) {
        console.error("Error adding domicilio:", error);
        return null;
    }
}

export async function addDomicilios(domiciliosData: Omit<Address, 'id'>[]): Promise<Address[]> {
    try {
        const batch = adminDb.batch();
        const addedDomicilios: Address[] = [];
        for (const domicilio of domiciliosData) {
            const newDocRef = adminDb.collection('addresses').doc();
            const newDomicilio = { id: newDocRef.id, ...domicilio };
            batch.set(newDocRef, newDomicilio);
            addedDomicilios.push(newDomicilio);
        }
        await batch.commit();
        return JSON.parse(JSON.stringify(addedDomicilios));
    } catch (error) {
        console.error("Error adding domicilios:", error);
        return [];
    }
}

export async function updateDomicilio(id: string, updates: Partial<Omit<Address, 'id'>>): Promise<Address | null> {
     try {
        const docRef = adminDb.collection('addresses').doc(id);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating domicilio ${id}:`, error);
        return null;
    }
}

export async function deleteDomicilio(id: string): Promise<boolean> {
    try {
        await adminDb.collection('addresses').doc(id).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting domicilio ${id}:`, error);
        return false;
    }
}
