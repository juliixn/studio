
"use server";

import { adminDb } from './firebase';
import type { VehicleInfo } from './definitions';

export async function getUserVehicles(userId: string): Promise<VehicleInfo[]> {
    try {
        const snapshot = await adminDb.collection('users').doc(userId).collection('vehicles').get();
        if (snapshot.empty) {
            return [];
        }
        const vehicles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleInfo));
        return JSON.parse(JSON.stringify(vehicles));
    } catch (error) {
        console.error(`Error fetching vehicles for user ${userId}:`, error);
        return [];
    }
}

export async function addUserVehicle(userId: string, vehicleData: Omit<VehicleInfo, 'id'>): Promise<VehicleInfo | null> {
    try {
        const newVehicleRef = adminDb.collection('users').doc(userId).collection('vehicles').doc();
        const newVehicle = {
            id: newVehicleRef.id,
            ...vehicleData
        };
        await newVehicleRef.set(newVehicle);
        return JSON.parse(JSON.stringify(newVehicle));
    } catch (error) {
        console.error("Error adding user vehicle:", error);
        return null;
    }
}

export async function updateUserVehicle(userId: string, vehicleId: string, updates: Partial<Omit<VehicleInfo, 'id'>>): Promise<VehicleInfo | null> {
    try {
        const vehicleRef = adminDb.collection('users').doc(userId).collection('vehicles').doc(vehicleId);
        await vehicleRef.update(updates);
        const updatedDoc = await vehicleRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating vehicle ${vehicleId}:`, error);
        return null;
    }
}

export async function deleteUserVehicle(userId: string, vehicleId: string): Promise<boolean> {
     try {
        await adminDb.collection('users').doc(userId).collection('vehicles').doc(vehicleId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting vehicle ${vehicleId}:`, error);
        return false;
    }
}
