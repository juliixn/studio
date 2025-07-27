
"use client";

import { createClient } from './supabase/client';
import type { Comunicado } from './definitions';

export async function getComunicados(condominioId?: string): Promise<Comunicado[]> {
    const supabase = createClient();
    let query = supabase.from('comunicados').select('*');

    if (condominioId) {
        // Return announcements for the specific condo OR announcements for 'all'
        query = query.or(`target.eq.all,target.eq.${condominioId}`);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching comunicados:", error);
        return [];
    }
    return data as Comunicado[];
}

export async function addComunicado(payload: Omit<Comunicado, 'id' | 'createdAt'>): Promise<Comunicado | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('comunicados')
        .insert([{ ...payload }])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding comunicado:", error);
        return null;
    }
    return data as Comunicado;
}
