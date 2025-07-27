
"use client";

import { createClient } from './supabase/client';
import type { VehicularRegistration, PedestrianRegistration } from './definitions';

// --- Vehicular Registrations ---

export async function getVehicularRegistrations(condominioId?: string): Promise<VehicularRegistration[]> {
    const supabase = createClient();
    let query = supabase.from('vehicular_registrations').select('*');
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    const { data, error } = await query.order('entryTimestamp', { ascending: false });

    if (error) {
        console.error("Error fetching vehicular registrations:", error);
        return [];
    }
    return data as VehicularRegistration[];
}

export async function addVehicularRegistration(registrationData: Omit<VehicularRegistration, 'id' | 'entryTimestamp'>): Promise<VehicularRegistration | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('vehicular_registrations')
        .insert([{ ...registrationData, entryTimestamp: new Date().toISOString() }])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding vehicular registration:", error);
        return null;
    }
    return data as VehicularRegistration;
}

export async function updateVehicularExit(registrationId: string): Promise<VehicularRegistration | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('vehicular_registrations')
        .update({ exitTimestamp: new Date().toISOString() })
        .eq('id', registrationId)
        .select()
        .single();

    if (error) {
        console.error("Error updating vehicular exit:", error);
        return null;
    }
    return data as VehicularRegistration;
}


// --- Pedestrian Registrations ---

export async function getPedestrianRegistrations(condominioId?: string): Promise<PedestrianRegistration[]> {
    const supabase = createClient();
    let query = supabase.from('pedestrian_registrations').select('*');
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    const { data, error } = await query.order('entryTimestamp', { ascending: false });

    if (error) {
        console.error("Error fetching pedestrian registrations:", error);
        return [];
    }
    return data as PedestrianRegistration[];
}

export async function addPedestrianRegistration(registrationData: Omit<PedestrianRegistration, 'id' | 'entryTimestamp'>): Promise<PedestrianRegistration | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('pedestrian_registrations')
        .insert([{ ...registrationData, entryTimestamp: new Date().toISOString() }])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding pedestrian registration:", error);
        return null;
    }
    return data as PedestrianRegistration;
}

export async function updatePedestrianExit(registrationId: string): Promise<PedestrianRegistration | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('pedestrian_registrations')
        .update({ exitTimestamp: new Date().toISOString() })
        .eq('id', registrationId)
        .select()
        .single();
        
    if (error) {
        console.error("Error updating pedestrian exit:", error);
        return null;
    }
    return data as PedestrianRegistration;
}
