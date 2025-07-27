
"use client";

import { createClient } from './supabase/client';
import type { BitacoraEntry, BitacoraEntryType } from './definitions';

// --- Public API using Supabase ---

export async function getBitacora(condominioId?: string): Promise<BitacoraEntry[]> {
    const supabase = createClient();
    let query = supabase.from('bitacora_entries').select('*');

    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching bitacora entries:", error);
        return [];
    }
    return data as BitacoraEntry[];
}

interface NewEntryPayload {
    condominioId: string;
    authorId: string;
    authorName: string;
    type: BitacoraEntryType;
    text: string;
    relatedId?: string;
    photos?: string[];
    category?: string;
    latitude?: number;
    longitude?: number;
}

export async function addBitacoraEntry(payload: NewEntryPayload): Promise<BitacoraEntry | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bitacora_entries')
        .insert([{ ...payload }])
        .select()
        .single();
        
    if (error) {
        console.error("Error adding bitacora entry:", error);
        return null;
    }
    return data as BitacoraEntry;
}

interface UpdateEntryPayload {
    text: string;
    photos: string[];
}

export async function updateBitacoraEntry(entryId: string, payload: UpdateEntryPayload): Promise<BitacoraEntry | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('bitacora_entries')
        .update({ 
            text: payload.text,
            photos: payload.photos,
            updatedAt: new Date().toISOString() 
        })
        .eq('id', entryId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating bitacora entry:", error);
        return null;
    }
    return data as BitacoraEntry;
}
