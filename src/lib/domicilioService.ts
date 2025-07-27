
"use client";

import { createClient } from './supabase/client';
import type { Address } from './definitions';

export async function getDomicilios(condominioId?: string): Promise<Address[]> {
    const supabase = createClient();
    let query = supabase.from('addresses').select('*').order('fullAddress');

    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    
    const { data, error } = await query;

    if (error) {
        console.error("Error fetching domicilios:", error);
        return [];
    }
    return data as Address[];
}

export async function addDomicilio(domicilioData: Omit<Address, 'id'>): Promise<Address | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('addresses').insert([domicilioData]).select().single();
    
    if (error) {
        console.error("Error adding domicilio:", error);
        return null;
    }
    return data as Address;
}

export async function addDomicilios(domiciliosData: Omit<Address, 'id'>[]): Promise<Address[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('addresses').insert(domiciliosData).select();
    
    if (error) {
        console.error("Error adding domicilios:", error);
        return [];
    }
    return data as Address[];
}

export async function updateDomicilio(id: string, updates: Partial<Omit<Address, 'id'>>): Promise<Address | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('addresses').update(updates).eq('id', id).select().single();

    if (error) {
        console.error(`Error updating domicilio ${id}:`, error);
        return null;
    }
    return data as Address;
}

export async function deleteDomicilio(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('addresses').delete().eq('id', id);

    if (error) {
        console.error(`Error deleting domicilio ${id}:`, error);
        return false;
    }
    return true;
}
