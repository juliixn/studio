
"use server";

import { adminDb } from './firebase';
import type { Condominio } from './definitions';

async function docToCondominio(doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>): Promise<Condominio> {
    const data = doc.data();
    if (!data) {
        throw new Error("Document data is undefined.");
    }
    return {
        id: doc.id,
        ...data,
    } as Condominio;
}

export async function getCondominios(): Promise<Condominio[]> {
    try {
        const snapshot = await adminDb.collection('condominios').orderBy('name').get();
        const condominios = await Promise.all(snapshot.docs.map(docToCondominio));
        return JSON.parse(JSON.stringify(condominios));
    } catch (error) {
        console.error("Error fetching condominios:", error);
        return [];
    }
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
    try {
        const doc = await adminDb.collection('condominios').doc(id).get();
        if (!doc.exists) return null;
        return JSON.parse(JSON.stringify(await docToCondominio(doc)));
    } catch (error) {
        console.error(`Error fetching condominio ${id}:`, error);
        return null;
    }
}

export async function addCondominio(condoData: Omit<Condominio, 'id'>): Promise<Condominio | null> {
    try {
        const newCondoRef = adminDb.collection('condominios').doc();
        const newCondo = {
            id: newCondoRef.id,
            status: 'Activo',
            ...condoData
        };
        await newCondoRef.set(newCondo);
        return JSON.parse(JSON.stringify(newCondo));
    } catch (error) {
        console.error("Error adding condominio:", error);
        return null;
    }
}

export async function updateCondominio(id: string, updates: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
    try {
        const docRef = adminDb.collection('condominios').doc(id);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify(await docToCondominio(updatedDoc)));
    } catch (error) {
        console.error(`Error updating condominio ${id}:`, error);
        return null;
    }
}

export async function deleteCondominio(id: string): Promise<boolean> {
     try {
        await adminDb.collection('condominios').doc(id).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting condominio ${id}:`, error);
        return false;
    }
}
