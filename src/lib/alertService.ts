
"use server";

import { adminDb } from './firebase';
import type { PanicAlert } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getActiveAlerts(): Promise<PanicAlert[]> {
    try {
        // In a real system, this would filter by unresolved alerts.
        // For now, we fetch all alerts.
        const snapshot = await adminDb.collection('panicAlerts').orderBy('createdAt', 'desc').get();
        const alerts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as PanicAlert
        });
        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error("Error fetching active alerts:", error);
        return [];
    }
}

export async function getActiveAlertsForCondo(condominioId: string): Promise<PanicAlert[]> {
     try {
        const snapshot = await adminDb.collection('panicAlerts').where('condominioId', '==', condominioId).orderBy('createdAt', 'desc').get();
         const alerts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as PanicAlert
        });
        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error(`Error fetching alerts for condo ${condominioId}:`, error);
        return [];
    }
}

export async function createPanicAlert(payload: Omit<PanicAlert, 'id' | 'createdAt'>): Promise<PanicAlert | null> {
    try {
        // Prevent creating duplicate alerts for the same condo if one is active
        const snapshot = await adminDb.collection('panicAlerts')
            .where('condominioId', '==', payload.condominioId)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            console.warn(`Alert already active for condo ${payload.condominioId}`);
            const doc = snapshot.docs[0];
            const data = doc.data();
            return JSON.parse(JSON.stringify({
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            }));
        }
        
        const newAlertRef = adminDb.collection('panicAlerts').doc();
        const newAlertData = {
            id: newAlertRef.id,
            ...payload,
            createdAt: Timestamp.now(),
        }
        await newAlertRef.set(newAlertData);

        return JSON.parse(JSON.stringify({
            ...newAlertData,
            createdAt: newAlertData.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error creating panic alert:", error);
        return null;
    }
}

export async function clearPanicAlert(alertId: string): Promise<boolean> {
    try {
        await adminDb.collection('panicAlerts').doc(alertId).delete();
        return true;
    } catch (error) {
        console.error(`Error clearing panic alert ${alertId}:`, error);
        return false;
    }
}
