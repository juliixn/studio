
"use server";

import prisma from './prisma';
import type { ResidentAccount, Transaction } from './definitions';

export async function getResidentAccounts(residentId?: string): Promise<any> {
    try {
        let profileWhere: any = {
            OR: [
                { role: 'Propietario' },
                { role: 'Renta' },
            ]
        };
        if (residentId) {
            profileWhere.id = residentId;
        }
        
        const profiles = await prisma.user.findMany({
            where: profileWhere,
        });

        const residentIds = profiles.map(p => p.id);

        const allAddresses = await prisma.address.findMany();
        const allCondos = await prisma.condominio.findMany();

        const transactions = await prisma.transaction.findMany({
            where: {
                residentId: { in: residentIds },
            },
            orderBy: { date: 'desc' },
        });

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
        const newCharge = await prisma.transaction.create({
            data: {
                residentId,
                concept,
                amount,
                type: 'charge',
                date: date || new Date().toISOString(),
            }
        });
        return JSON.parse(JSON.stringify(newCharge));
    } catch (error) {
        console.error("Error adding charge:", error);
        return null;
    }
}

export async function addPayment(residentId: string, concept: string, amount: number): Promise<Transaction | null> {
    try {
        const newPayment = await prisma.transaction.create({
            data: {
                residentId,
                concept,
                amount,
                type: 'payment',
                date: new Date().toISOString(),
            }
        });
        return JSON.parse(JSON.stringify(newPayment));
    } catch (error) {
        console.error("Error adding payment:", error);
        return null;
    }
}
