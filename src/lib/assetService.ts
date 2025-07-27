
"use client";

import { createClient } from './supabase/client';
import type { Asset } from './definitions';

export async function getAssets(condominioId?: string): Promise<Asset[]> {
    const supabase = createClient();
    let query = supabase.from('assets').select('*');
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    const { data, error } = await query.order('name');
    if (error) {
        console.error("Error fetching assets:", error);
        return [];
    }
    return data as Asset[];
}

export async function addAsset(assetData: Omit<Asset, 'id'>): Promise<Asset | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('assets').insert([assetData]).select().single();
    if (error) {
        console.error("Error adding asset:", error);
        return null;
    }
    return data as Asset;
}

export async function updateAsset(assetId: string, updates: Partial<Omit<Asset, 'id'>>): Promise<Asset | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('assets').update(updates).eq('id', assetId).select().single();
    if (error) {
        console.error(`Error updating asset ${assetId}:`, error);
        return null;
    }
    return data as Asset;
}

export async function deleteAsset(assetId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('assets').delete().eq('id', assetId);
    if (error) {
        console.error(`Error deleting asset ${assetId}:`, error);
        return false;
    }
    return true;
}
