
"use server";

import { adminDb } from './firebase';
import type { VehicularRegistration, PedestrianRegistration } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

// --- Vehicular Registrations ---

export async function getVehicularRegistrations(condominioId?: string): Promise<VehicularRegistration[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('vehicularRegistrations');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('entryTimestamp', 'desc').get();
        const registrations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                entryTimestamp: data.entryTimestamp.toDate().toISOString(),
                exitTimestamp: data.exitTimestamp ? data.exitTimestamp.toDate().toISOString() : undefined,
            } as VehicularRegistration;
        });
        return JSON.parse(JSON.stringify(registrations));
    } catch (error) {
        console.error("Error fetching vehicular registrations:", error);
        return [];
    }
}

export async function addVehicularRegistration(reg: Omit<VehicularRegistration, 'id' | 'entryTimestamp'>): Promise<VehicularRegistration | null> {
    try {
        const newDocRef = adminDb.collection('vehicularRegistrations').doc();
        const newRegData = {
            id: newDocRef.id,
            ...reg,
            entryTimestamp: Timestamp.now(),
        };
        await newDocRef.set(newRegData);
        return JSON.parse(JSON.stringify({
            ...newRegData,
            entryTimestamp: newRegData.entryTimestamp.toDate().toISOString()
        }));
    } catch (error) {
        console.error("Error adding vehicular registration:", error);
        return null;
    }
}

export async function updateVehicularExit(id: string): Promise<VehicularRegistration | null> {
     try {
        const docRef = adminDb.collection('vehicularRegistrations').doc(id);
        await docRef.update({ exitTimestamp: Timestamp.now() });
        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if (!data) return null;
        return JSON.parse(JSON.stringify({
            id: docRef.id,
            ...data,
            entryTimestamp: data.entryTimestamp.toDate().toISOString(),
            exitTimestamp: data.exitTimestamp.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error updating vehicular exit for ${id}:`, error);
        return null;
    }
}

// --- Pedestrian Registrations ---

export async function getPedestrianRegistrations(condominioId?: string): Promise<PedestrianRegistration[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('pedestrianRegistrations');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('entryTimestamp', 'desc').get();
        const registrations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                entryTimestamp: data.entryTimestamp.toDate().toISOString(),
                exitTimestamp: data.exitTimestamp ? data.exitTimestamp.toDate().toISOString() : undefined,
            } as PedestrianRegistration;
        });
        return JSON.parse(JSON.stringify(registrations));
    } catch (error) {
        console.error("Error fetching pedestrian registrations:", error);
        return [];
    }
}

export async function addPedestrianRegistration(reg: Omit<PedestrianRegistration, 'id' | 'entryTimestamp'>): Promise<PedestrianRegistration | null> {
    try {
        const newDocRef = adminDb.collection('pedestrianRegistrations').doc();
        const newRegData = {
            id: newDocRef.id,
            ...reg,
            entryTimestamp: Timestamp.now(),
        };
        await newDocRef.set(newRegData);
        return JSON.parse(JSON.stringify({
            ...newRegData,
            entryTimestamp: newRegData.entryTimestamp.toDate().toISOString()
        }));
    } catch (error) {
        console.error("Error adding pedestrian registration:", error);
        return null;
    }
}

export async function updatePedestrianExit(id: string): Promise<PedestrianRegistration | null> {
    try {
        const docRef = adminDb.collection('pedestrianRegistrations').doc(id);
        await docRef.update({ exitTimestamp: Timestamp.now() });
        const updatedDoc = await docRef.get();
        const data = updatedDoc.data();
        if (!data) return null;
        return JSON.parse(JSON.stringify({
            id: docRef.id,
            ...data,
            entryTimestamp: data.entryTimestamp.toDate().toISOString(),
            exitTimestamp: data.exitTimestamp.toDate().toISOString(),
        }));
    } catch (error) {
        console.error(`Error updating pedestrian exit for ${id}:`, error);
        return null;
    }
}
