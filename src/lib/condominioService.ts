
"use client";

import { createClient } from './supabase/client';
import type { Condominio } from './definitions';

export async function getCondominios(): Promise<Condominio[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('condominios').select('*').order('name');
    if (error) {
        console.error("Error fetching condominios:", error);
        return [];
    }
    return data as Condominio[];
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('condominios').select('*').eq('id', id).single();
    if (error) {
        console.error(`Error fetching condominio ${id}:`, error);
        return null;
    }
    return data as Condominio;
}

export async function addCondominio(condoData: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('condominios').insert([condoData]).select().single();
    if (error) {
        console.error("Error adding condominio:", error);
        return null;
    }
    return data as Condominio;
}

export async function updateCondominio(id: string, updates: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('condominios').update(updates).eq('id', id).select().single();
    if (error) {
        console.error(`Error updating condominio ${id}:`, error);
        return null;
    }
    return data as Condominio;
}

export async function deleteCondominio(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('condominios').delete().eq('id', id);
    if (error) {
        console.error(`Error deleting condominio ${id}:`, error);
        return false;
    }
    return true;
}
