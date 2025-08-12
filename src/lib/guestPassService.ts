
"use server";

import { adminDb } from './firebase';
import type { GuestPass } from './definitions';
import { addDays, addMonths, addYears, isAfter } from 'date-fns';
import { Timestamp } from 'firebase-admin/firestore';

export async function getGuestPasses(condominioId?: string, residentId?: string): Promise<GuestPass[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('guestPasses');
        if (condominioId) {
            query = query.where('condominioId', '==', condominioId);
        }
        if (residentId) {
            query = query.where('residentId', '==', residentId);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const passes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestPass));
        return JSON.parse(JSON.stringify(passes));
    } catch (error) {
        console.error("Error fetching guest passes:", error);
        return [];
    }
}

export async function getGuestPassById(passId: string): Promise<GuestPass | null> {
    try {
        const doc = await adminDb.collection('guestPasses').doc(passId).get();
        
        if (!doc.exists) return null;
        const pass = { id: doc.id, ...doc.data() } as GuestPass;

        if (pass.passType === 'temporal' && pass.validUntil && isAfter(new Date(), new Date(pass.validUntil))) {
            // Pass has expired
            return null;
        }
        
        return JSON.parse(JSON.stringify(pass));
    } catch (error) {
        console.error(`Error fetching guest pass ${passId}:`, error);
        return null;
    }
}

type AddPassPayload = Omit<GuestPass, 'id' | 'createdAt' | 'validUntil'> & {
    durationValue?: number;
    durationUnit?: 'days' | 'months' | 'years';
};

export async function addGuestPass(payload: AddPassPayload): Promise<GuestPass | null> {
    try {
        let validUntil: string | null = null;
        if (payload.passType === 'temporal' && payload.durationValue && payload.durationUnit) {
            const now = new Date();
            switch (payload.durationUnit) {
                case 'days':
                    validUntil = addDays(now, payload.durationValue).toISOString();
                    break;
                case 'months':
                    validUntil = addMonths(now, payload.durationValue).toISOString();
                    break;
                case 'years':
                    validUntil = addYears(now, payload.durationValue).toISOString();
                    break;
            }
        }
        
        const { durationValue, durationUnit, ...restOfPayload } = payload;
        
        const newDocRef = adminDb.collection('guestPasses').doc();
        const newPass = {
            id: newDocRef.id,
            ...restOfPayload,
            validUntil,
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newPass);
        
        return JSON.parse(JSON.stringify({
            ...newPass,
            createdAt: newPass.createdAt.toDate().toISOString()
        }));
    } catch (error) {
        console.error("Error adding guest pass:", error);
        return null;
    }
}

export async function deleteGuestPass(passId: string): Promise<boolean> {
    try {
        await adminDb.collection('guestPasses').doc(passId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting guest pass ${passId}:`, error);
        return false;
    }
}
