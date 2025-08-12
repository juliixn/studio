"use server";

import { adminDb } from './firebase';
import type { Comunicado } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getComunicados(condominioId?: string): Promise<Comunicado[]> {
    try {
        let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('comunicados');

        // This logic is more complex in Firestore than in Prisma.
        // For now, if a condominioId is provided, we fetch for that specific condo AND for 'all'.
        // A more scalable solution might involve user-specific feeds.
        if (condominioId) {
             const condoSnapshot = await query.where('target', '==', condominioId).get();
             const allSnapshot = await query.where('target', '==', 'all').get();
             const comunicados = [...condoSnapshot.docs, ...allSnapshot.docs]
                .map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        createdAt: data.createdAt.toDate().toISOString(),
                    } as Comunicado
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return JSON.parse(JSON.stringify(comunicados));
        }

        // If no condominioId, fetch all.
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const comunicados = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as Comunicado;
        });

        return JSON.parse(JSON.stringify(comunicados));
    } catch (error) {
        console.error("Error fetching comunicados:", error);
        return [];
    }
}

export async function addComunicado(payload: Omit<Comunicado, 'id' | 'createdAt'>): Promise<Comunicado | null> {
    try {
        const newDocRef = adminDb.collection('comunicados').doc();
        const newComunicado = {
            id: newDocRef.id,
            ...payload,
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newComunicado);
        return JSON.parse(JSON.stringify({
            ...newComunicado,
            createdAt: newComunicado.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error adding comunicado:", error);
        return null;
    }
}
