
"use server";

import { adminDb } from './firebase';
import type { WorkOrder } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';


export async function getWorkOrders(condominioId?: string): Promise<WorkOrder[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('workOrders');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const workOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
                completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : undefined,
            } as WorkOrder;
        });
        return JSON.parse(JSON.stringify(workOrders));
    } catch (error) {
        console.error("Error fetching work orders:", error);
        return [];
    }
}

export async function addWorkOrder(orderData: Omit<WorkOrder, 'id' | 'createdAt'>): Promise<WorkOrder | null> {
    try {
        const newDocRef = adminDb.collection('workOrders').doc();
        const newOrder = {
            id: newDocRef.id,
            ...orderData,
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newOrder);
        return JSON.parse(JSON.stringify(newOrder));
    } catch (error) {
        console.error("Error adding work order:", error);
        return null;
    }
}

export async function updateWorkOrder(orderId: string, updates: Partial<Omit<WorkOrder, 'id' | 'createdAt'>>): Promise<WorkOrder | null> {
    try {
        const updateData: any = { ...updates };
        if (updates.status === 'Completada' && !updates.completedAt) {
            updateData.completedAt = Timestamp.now();
        }
        const docRef = adminDb.collection('workOrders').doc(orderId);
        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating work order ${orderId}:`, error);
        return null;
    }
}

export async function deleteWorkOrder(orderId: string): Promise<boolean> {
    try {
        await adminDb.collection('workOrders').doc(orderId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting work order ${orderId}:`, error);
        return false;
    }
}
