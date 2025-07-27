
"use client";

import { createClient } from './supabase/client';
import type { ResidentAccount, Transaction } from './definitions';

export async function getResidentAccounts(residentId?: string): Promise<any> {
    const supabase = createClient();
    let profileQuery = supabase.from('profiles').select('id, name, addressId, condominioId');

    if (residentId) {
        profileQuery = profileQuery.eq('id', residentId);
    } else {
        profileQuery = profileQuery.or('role.eq.Propietario,role.eq.Renta');
    }

    const { data: profiles, error: profileError } = await profileQuery;
    if (profileError) {
        console.error("Error fetching resident profiles:", profileError);
        return residentId ? null : [];
    }

    const { data: allAddresses, error: addressError } = await supabase.from('addresses').select('*');
    if (addressError) console.error("Error fetching addresses:", addressError);
    
    const { data: allCondos, error: condoError } = await supabase.from('condominios').select('*');
    if (condoError) console.error("Error fetching condominios:", condoError);

    let transactionQuery = supabase.from('transactions').select('*');
    if (residentId) {
        transactionQuery = transactionQuery.eq('residentId', residentId);
    }
    const { data: transactions, error: transactionError } = await transactionQuery.order('date', { ascending: false });
    if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
        return residentId ? null : [];
    }

    const accounts = profiles.map(profile => {
        const userTransactions = transactions.filter(t => t.residentId === profile.id);
        const balance = userTransactions.reduce((acc, tx) => {
            return tx.type === 'charge' ? acc + tx.amount : acc - tx.amount;
        }, 0);
        
        const address = allAddresses?.find(a => a.id === profile.addressId);
        const condo = address ? allCondos?.find(c => c.id === address.condominioId) : null;

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

    return residentId ? accounts[0] || null : accounts;
}


export async function addCharge(residentId: string, concept: string, amount: number, date?: string): Promise<Transaction | null> {
    const supabase = createClient();
    const chargeData = {
        residentId,
        concept,
        amount,
        type: 'charge' as const,
        date: date || new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('transactions').insert([chargeData]).select().single();
    if (error) {
        console.error("Error adding charge:", error);
        return null;
    }
    return data;
}

export async function addPayment(residentId: string, concept: string, amount: number): Promise<Transaction | null> {
     const supabase = createClient();
    const paymentData = {
        residentId,
        concept,
        amount,
        type: 'payment' as const,
        date: new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('transactions').insert([paymentData]).select().single();
    if (error) {
        console.error("Error adding payment:", error);
        return null;
    }
    return data;
}
