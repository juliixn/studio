
"use client";

import { createClient } from './supabase/client';
import type { VehicleInfo } from './definitions';

export async function getUserVehicles(userId: string): Promise<VehicleInfo[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error fetching vehicles for user ${userId}:`, error);
        return [];
    }
    return data as VehicleInfo[];
}

export async function addUserVehicle(userId: string, vehicleData: Omit<VehicleInfo, 'id'>): Promise<VehicleInfo | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_vehicles')
        .insert([{ user_id: userId, ...vehicleData }])
        .select()
        .single();

    if (error) {
        console.error("Error adding user vehicle:", error);
        return null;
    }
    return data as VehicleInfo;
}

export async function updateUserVehicle(vehicleId: string, updates: Partial<Omit<VehicleInfo, 'id'>>): Promise<VehicleInfo | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_vehicles')
        .update(updates)
        .eq('id', vehicleId)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating vehicle ${vehicleId}:`, error);
        return null;
    }
    return data as VehicleInfo;
}

export async function deleteUserVehicle(vehicleId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('user_vehicles').delete().eq('id', vehicleId);
    if (error) {
        console.error(`Error deleting vehicle ${vehicleId}:`, error);
        return false;
    }
    return true;
}
