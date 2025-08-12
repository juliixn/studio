
"use server";

import { adminDb } from './firebase';
import type { Peticion, PeticionComment } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';


export async function getPeticiones(condominioId?: string, creatorId?: string): Promise<Peticion[]> {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('peticiones');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        if (creatorId) {
            query = query.where('creatorId', '==', creatorId);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const peticiones = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: c.createdAt.toDate().toISOString() }))
            } as Peticion;
        });
        return JSON.parse(JSON.stringify(peticiones));
    } catch (error) {
        console.error("Error fetching peticiones:", error);
        return [];
    }
}

export async function addPeticion(peticionData: Omit<Peticion, 'id' | 'createdAt' | 'status' | 'comments'>): Promise<Peticion | null> {
    try {
        const newDocRef = adminDb.collection('peticiones').doc();
        const newPeticion = {
            id: newDocRef.id,
            ...peticionData,
            status: 'Abierta',
            createdAt: Timestamp.now(),
            comments: [],
        };
        await newDocRef.set(newPeticion);
        return JSON.parse(JSON.stringify({
            ...newPeticion,
            createdAt: newPeticion.createdAt.toDate().toISOString()
        }));
    } catch (error) {
        console.error("Error adding peticion:", error);
        return null;
    }
}

export async function updatePeticion(peticionId: string, updates: Partial<Peticion>): Promise<Peticion | null> {
    try {
        const docRef = adminDb.collection('peticiones').doc(peticionId);
        
        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw "Document does not exist!";
            }
            
            const existingData = doc.data() as Peticion;
            let finalUpdates: any = { ...updates };
            
            // Handle comments array update
            if (updates.comments && updates.comments.length > 0) {
                const existingComments = existingData.comments || [];
                // Find only the new comments to add
                const newComments = updates.comments
                    .filter(uc => !existingComments.some(ec => ec.id === uc.id))
                    .map(c => ({...c, createdAt: Timestamp.now()}));
                
                finalUpdates.comments = [...existingComments, ...newComments];
            } else {
                delete finalUpdates.comments; // Don't overwrite comments array if not provided
            }

            transaction.update(docRef, finalUpdates);
        });

        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if (!data) return null;

        return JSON.parse(JSON.stringify({
            ...data,
            id: updatedDoc.id,
            createdAt: data.createdAt.toDate().toISOString(),
            comments: (data.comments || []).map((c: any) => ({ ...c, createdAt: c.createdAt.toDate().toISOString() }))
        }));

    } catch (error) {
        console.error("Error updating peticion:", error);
        return null;
    }
}
