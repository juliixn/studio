
"use client";

import { createClient } from './supabase/client';
import type { CommunityEvent } from './definitions';

export async function getEvents(condominioId?: string): Promise<CommunityEvent[]> {
    const supabase = createClient();
    let query = supabase.from('events').select('*');

    if (condominioId) {
        query = query.or(`condominioId.eq.all,condominioId.eq.${condominioId}`);
    }
    
    const { data, error } = await query.order('start', { ascending: true });

    if (error) {
        console.error("Error fetching events:", error);
        return [];
    }
    return data as CommunityEvent[];
}

export async function addEvent(event: Omit<CommunityEvent, 'id'>): Promise<CommunityEvent | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('events').insert([event]).select().single();
    if (error) {
        console.error("Error adding event:", error);
        return null;
    }
    return data as CommunityEvent;
}

export async function updateEvent(eventId: string, updates: Partial<Omit<CommunityEvent, 'id'>>): Promise<CommunityEvent | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('events').update(updates).eq('id', eventId).select().single();
    if (error) {
        console.error(`Error updating event ${eventId}:`, error);
        return null;
    }
    return data as CommunityEvent;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
        console.error(`Error deleting event ${eventId}:`, error);
        return false;
    }
    return true;
}
