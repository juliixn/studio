
"use server";

import { adminDb } from './firebase';
import type { VisitorNotification } from './definitions';
import { subHours } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

export async function getVisitorNotifications(condominioId?: string, residentId?: string): Promise<VisitorNotification[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('visitorNotifications');

        if (condominioId && !residentId) {
             query = query.where('condominioId', '==', condominioId);
        } else if (residentId) {
            query = query.where('residentId', '==', residentId);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        const notifications = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate().toISOString(),
            } as VisitorNotification;
        });

        const now = new Date();
        const twentyFourHoursAgo = subHours(now, 24);

        // Filter out expired notifications on the server side
        const validNotifications = notifications.filter(n => {
            if (n.status === 'Activa') {
                return new Date(n.createdAt) > twentyFourHoursAgo;
            }
            return true;
        });

        return JSON.parse(JSON.stringify(validNotifications));

    } catch (error) {
        console.error("Error fetching visitor notifications:", error);
        return [];
    }
}

export async function addVisitorNotification(payload: Omit<VisitorNotification, 'id' | 'createdAt' | 'status'>): Promise<VisitorNotification | null> {
     try {
        const newDocRef = adminDb.collection('visitorNotifications').doc();
        const newNotification = {
            id: newDocRef.id,
            ...payload,
            status: 'Activa',
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newNotification);
        return JSON.parse(JSON.stringify({
            ...newNotification,
            createdAt: newNotification.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error adding visitor notification:", error);
        return null;
    }
}

export async function updateVisitorNotification(notificationId: string, payload: Partial<Omit<VisitorNotification, 'id'>>): Promise<VisitorNotification | null> {
    try {
        const docRef = adminDb.collection('visitorNotifications').doc(notificationId);
        await docRef.update(payload);
        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if (!data) return null;
        return JSON.parse(JSON.stringify({
            id: docRef.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error updating visitor notification ${notificationId}:`, error);
        return null;
    }
}
