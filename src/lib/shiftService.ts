
"use client";

import { createClient } from './supabase/client';
import type { ShiftRecord, TurnoInfo, ShiftIncidentType } from './definitions';

export async function getShiftRecords(guardId?: string): Promise<ShiftRecord[]> {
    const supabase = createClient();
    let query = supabase.from('shift_records').select('*');
    if (guardId) {
        query = query.eq('guardId', guardId);
    }
    const { data, error } = await query.order('startTime', { ascending: false });

    if (error) {
        console.error("Error fetching shift records:", error);
        return [];
    }
    return data as ShiftRecord[];
}


export async function getActiveShiftForGuard(guardId: string): Promise<ShiftRecord | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('shift_records')
        .select('*')
        .eq('guardId', guardId)
        .is('endTime', null)
        .order('startTime', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error("Error fetching active shift:", error);
    }
    
    return data as ShiftRecord | null;
}

export async function getActiveShifts(condominioId?: string): Promise<ShiftRecord[]> {
    const supabase = createClient();
    let query = supabase.from('shift_records').select('*').is('endTime', null);
    if(condominioId) {
        query = query.eq('condominioId', condominioId);
    }

    const { data, error } = await query;
     if (error) {
        console.error("Error fetching active shifts:", error);
        return [];
    }
    return data as ShiftRecord[];
}


export async function startShift(guardId: string, guardName: string, turnoInfo: TurnoInfo): Promise<ShiftRecord | null> {
    const supabase = createClient();
    const newRecord = {
        guardId,
        guardName,
        condominioId: turnoInfo.condominioId,
        condominioName: turnoInfo.condominioName,
        turno: turnoInfo.turno,
        startTime: new Date().toISOString(),
        equipmentIds: turnoInfo.equipmentIds,
    };
    
    const { data, error } = await supabase.from('shift_records').insert([newRecord]).select().single();
    if (error) {
        console.error("Error starting shift:", error);
        return null;
    }
    return data as ShiftRecord;
}

export async function endShift(shiftId: string, handoverNotes?: string): Promise<ShiftRecord | null> {
    const supabase = createClient();
    const updates: Partial<ShiftRecord> = {
        endTime: new Date().toISOString()
    };
    if (handoverNotes && handoverNotes.trim()) {
        updates.handoverNotes = handoverNotes;
    }

    const { data, error } = await supabase
        .from('shift_records')
        .update(updates)
        .eq('id', shiftId)
        .select()
        .single();

    if (error) {
        console.error(`Error ending shift ${shiftId}:`, error);
        return null;
    }
    return data as ShiftRecord;
}

export async function updateShiftIncident(shiftId: string, incident: ShiftIncidentType | null): Promise<ShiftRecord | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('shift_records')
        .update({ incident })
        .eq('id', shiftId)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating incident for shift ${shiftId}:`, error);
        return null;
    }
    return data as ShiftRecord;
}
