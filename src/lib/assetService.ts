
"use server";

import { adminDb } from './firebase';
import type { Asset } from './definitions';

export async function getAssets(condominioId?: string): Promise<Asset[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('assets');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        const assets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset));
        return JSON.parse(JSON.stringify(assets));
    } catch (error) {
        console.error("Error fetching assets:", error);
        return [];
    }
}

export async function addAsset(assetData: Omit<Asset, 'id'>): Promise<Asset | null> {
    try {
        const newDocRef = adminDb.collection('assets').doc();
        const newAsset = { id: newDocRef.id, ...assetData };
        await newDocRef.set(newAsset);
        return JSON.parse(JSON.stringify(newAsset));
    } catch (error) {
        console.error("Error adding asset:", error);
        return null;
    }
}

export async function updateAsset(assetId: string, updates: Partial<Omit<Asset, 'id'>>): Promise<Asset | null> {
    try {
        const docRef = adminDb.collection('assets').doc(assetId);
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating asset ${assetId}:`, error);
        return null;
    }
}

export async function deleteAsset(assetId: string): Promise<boolean> {
    try {
        await adminDb.collection('assets').doc(assetId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting asset ${assetId}:`, error);
        return false;
    }
}
