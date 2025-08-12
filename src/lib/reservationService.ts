
"use server";

import { adminDb } from './firebase';
import type { Reservation, ReservationStatus, CommonArea } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

// --- Common Area Service ---
export async function getCommonAreas(condominioId?: string): Promise<CommonArea[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('commonAreas');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        const areas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommonArea));
        return JSON.parse(JSON.stringify(areas));
    } catch (error) {
        console.error("Error fetching common areas:", error);
        return [];
    }
}

export async function addCommonArea(area: Omit<CommonArea, 'id'>): Promise<CommonArea | null> {
    try {
        const newDocRef = adminDb.collection('commonAreas').doc();
        const newArea = { id: newDocRef.id, ...area };
        await newDocRef.set(newArea);
        return JSON.parse(JSON.stringify(newArea));
    } catch (error) {
        console.error("Error adding common area:", error);
        return null;
    }
}

export async function updateCommonArea(areaId: string, payload: Partial<Omit<CommonArea, 'id'>>): Promise<CommonArea | null> {
     try {
        const docRef = adminDb.collection('commonAreas').doc(areaId);
        await docRef.update(payload);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating common area ${areaId}:`, error);
        return null;
    }
}

export async function deleteCommonArea(areaId: string): Promise<boolean> {
    try {
        await adminDb.collection('commonAreas').doc(areaId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting common area ${areaId}:`, error);
        return false;
    }
}


// --- Reservation Service ---
export async function getReservations(condominioId?: string, userId?: string): Promise<Reservation[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('reservations');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        if (userId) {
            query = query.where('userId', '==', userId);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const reservations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate().toISOString(),
            } as Reservation;
        });
        return JSON.parse(JSON.stringify(reservations));
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return [];
    }
}

export async function addReservation(res: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<Reservation | null> {
    try {
        const newDocRef = adminDb.collection('reservations').doc();
        const newReservation = {
            id: newDocRef.id,
            ...res,
            status: 'Pendiente',
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newReservation);
        return JSON.parse(JSON.stringify({
            ...newReservation,
            createdAt: newReservation.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error adding reservation:", error);
        return null;
    }
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus): Promise<Reservation | null> {
    try {
        const docRef = adminDb.collection('reservations').doc(reservationId);
        await docRef.update({ status });
        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if (!data) return null;
        return JSON.parse(JSON.stringify({
            id: updatedDoc.id,
            ...data,
            createdAt: data.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error updating reservation status for ${reservationId}:`, error);
        return null;
    }
}
