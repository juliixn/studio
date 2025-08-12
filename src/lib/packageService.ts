
"use server";

import { adminDb } from './firebase';
import type { Package } from './definitions';

export async function getPackages(condominioId?: string, recipientId?: string): Promise<Package[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('packages');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        if (recipientId) {
            // Firestore does not support multiple 'where' clauses on different fields unless an index is created.
            // For this app, we will filter in memory if both are provided.
        }
        
        const snapshot = await query.orderBy('receivedAt', 'desc').get();
        let packages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
        
        if (recipientId && !condominioId) { // Only filter by recipient if condoId is not used in query
            packages = packages.filter(p => p.recipientId === recipientId);
        }

        return JSON.parse(JSON.stringify(packages));
    } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
}

export async function getPackageById(packageId: string): Promise<Package | null> {
    try {
        const doc = await adminDb.collection('packages').doc(packageId).get();
        if (!doc.exists) return null;
        return JSON.parse(JSON.stringify({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`Error fetching package ${packageId}:`, error);
        return null;
    }
}

export async function addPackage(pkg: Omit<Package, 'id' | 'status' | 'receivedAt'>): Promise<Package | null> {
    try {
        const newDocRef = adminDb.collection('packages').doc();
        const newPackageData = {
            id: newDocRef.id,
            ...pkg,
            status: pkg.damageNotes ? 'Con Daño' : 'En Recepción',
            receivedAt: new Date().toISOString(),
        };
        await newDocRef.set(newPackageData);
        return JSON.parse(JSON.stringify(newPackageData));
    } catch (error) {
        console.error("Error adding package:", error);
        return null;
    }
}

export async function updatePackage(packageId: string, payload: Partial<Pick<Package, 'status' | 'damageNotes' | 'deliveryPhotoUrl' | 'deliverySignatureUrl' | 'deliveredToName'>>): Promise<Package | null> {
    try {
        const docRef = adminDb.collection('packages').doc(packageId);
        const updateData: any = { ...payload };
        if (payload.status === 'Entregado') {
            updateData.deliveredAt = new Date().toISOString();
        }

        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating package ${packageId}:`, error);
        return null;
    }
}
