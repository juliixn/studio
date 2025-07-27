
"use client";

import { createClient } from './supabase/client';
import type { Peticion } from './definitions';

// --- Public API using Supabase ---

export async function getPeticiones(condominioId?: string, creatorId?: string): Promise<Peticion[]> {
    const supabase = createClient();
    let query = supabase.from('peticiones').select('*');

    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    if (creatorId) {
        query = query.eq('creatorId', creatorId);
    }
    
    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching peticiones:", error);
        return [];
    }

    return data as Peticion[];
}

export async function addPeticion(peticionData: Omit<Peticion, 'id' | 'createdAt' | 'status' | 'comments'>): Promise<Peticion | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('peticiones')
        .insert([{ 
            ...peticionData,
            status: 'Abierta',
            comments: [] 
        }])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding peticion:", error);
        return null;
    }
    return data as Peticion;
}

export async function updatePeticion(peticionId: string, updates: Partial<Omit<Peticion, 'id'>>): Promise<Peticion | null> {
    const supabase = createClient();
    
    const updateData = { ...updates };
    // Asegurarse de que el ID no se incluya en el payload de actualización
    delete (updateData as any).id;
    
    const { data, error } = await supabase
        .from('peticiones')
        .update(updateData)
        .eq('id', peticionId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating peticion:", error);
        return null;
    }
    return data as Peticion;
}
