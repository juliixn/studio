
"use server";

import { adminDb } from './firebase';
import type { ResidentAccount, Transaction, User } from './definitions';

export async function getResidentAccounts(residentId?: string): Promise<any> {
    try {
        const usersSnapshot = await adminDb.collection('users').get();
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

        let profiles = allUsers.filter(u => u.role === 'Propietario' || u.role === 'Renta');

        if (residentId) {
            profiles = profiles.filter(p => p.id === residentId);
        }
        
        const residentIds = profiles.map(p => p.id);

        const addressesSnapshot = await adminDb.collection('addresses').get();
        const allAddresses = addressesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const condosSnapshot = await adminDb.collection('condominios').get();
        const allCondos = condosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const transactionsSnapshot = await adminDb.collection('transactions').where('residentId', 'in', residentIds.length > 0 ? residentIds : ['dummyId']).get();
        const transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const accounts = profiles.map(profile => {
            const userTransactions = transactions.filter(t => t.residentId === profile.id);
            const balance = userTransactions.reduce((acc, tx) => {
                return tx.type === 'charge' ? acc + tx.amount : acc - tx.amount;
            }, 0);
            
            const address = allAddresses.find(a => a.id === profile.addressId);
            const condo = address ? allCondos.find(c => c.id === address.condominioId) : null;

            return {
                residentId: profile.id,
                residentName: profile.name,
                address: address?.fullAddress || 'N/A',
                condominioId: condo?.id || 'N/A',
                condominioName: condo?.name || 'N/A',
                balance,
                transactions: userTransactions
            } as ResidentAccount;
        });

        return residentId ? (accounts[0] || null) : accounts;
    } catch (error) {
        console.error("Error fetching resident accounts:", error);
        return residentId ? null : [];
    }
}


export async function addCharge(residentId: string, concept: string, amount: number, date?: string): Promise<Transaction | null> {
    try {
        const newDocRef = adminDb.collection('transactions').doc();
        const newCharge = {
            id: newDocRef.id,
            residentId,
            concept,
            amount,
            type: 'charge',
            date: date || new Date().toISOString(),
        };
        await newDocRef.set(newCharge);
        return JSON.parse(JSON.stringify(newCharge));
    } catch (error) {
        console.error("Error adding charge:", error);
        return null;
    }
}

export async function addPayment(residentId: string, concept: string, amount: number): Promise<Transaction | null> {
    try {
        const newDocRef = adminDb.collection('transactions').doc();
        const newPayment = {
            id: newDocRef.id,
            residentId,
            concept,
            amount,
            type: 'payment',
            date: new Date().toISOString(),
        };
        await newDocRef.set(newPayment);
        return JSON.parse(JSON.stringify(newPayment));
    } catch (error) {
        console.error("Error adding payment:", error);
        return null;
    }
}
