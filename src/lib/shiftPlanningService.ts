

"use client";

import { createClient } from './supabase/client';
import type { PlannedShift } from './definitions';

export async function getPlannedShifts(): Promise<PlannedShift[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('planned_shifts').select('*');
    if (error) {
        console.error("Error fetching planned shifts:", error);
        return [];
    }
    return data as PlannedShift[];
}

type AddOrUpdatePayload = Omit<PlannedShift, 'id'>;

export async function addOrUpdatePlannedShift(payload: AddOrUpdatePayload): Promise<PlannedShift | null> {
    const supabase = createClient();
    const id = `${payload.condominioId}-${payload.date}-${payload.turno}-${payload.slot}`;
    const newShift: PlannedShift = { ...payload, id };
    
    // Use upsert to either insert or update the record
    const { data, error } = await supabase
        .from('planned_shifts')
        .upsert(newShift)
        .select()
        .single();
    
    if (error) {
        console.error("Error adding or updating planned shift:", error);
        return null;
    }
    return data as PlannedShift;
}

export async function removePlannedShift(shiftId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('planned_shifts').delete().eq('id', shiftId);
    
    if (error) {
        console.error(`Error removing planned shift ${shiftId}:`, error);
        return false;
    }
    return true;
}
