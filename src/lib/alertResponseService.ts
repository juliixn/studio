
"use server";

import { adminDb } from './firebase';
import type { AlertResponse } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getAlertResponses(condominioId?: string): Promise<AlertResponse[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('alertResponses');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const responses = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as AlertResponse
        });
        return JSON.parse(JSON.stringify(responses));
    } catch (error) {
        console.error("Error fetching alert responses:", error);
        return [];
    }
}

type AddAlertResponsePayload = Omit<AlertResponse, 'id' | 'createdAt'>;

export async function addAlertResponse(payload: AddAlertResponsePayload): Promise<AlertResponse | null> {
    try {
        const newResponseRef = adminDb.collection('alertResponses').doc();
        const newResponseData = {
            id: newResponseRef.id,
            ...payload,
            createdAt: Timestamp.now(),
        };

        await newResponseRef.set(newResponseData);
        return JSON.parse(JSON.stringify({
            ...newResponseData,
            createdAt: newResponseData.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error adding alert response:", error);
        return null;
    }
}
