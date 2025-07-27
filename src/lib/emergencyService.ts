
"use client";

import { createClient } from './supabase/client';
import type { EmergencyContact } from './definitions';

export async function getEmergencyContacts(condominioId?: string): Promise<EmergencyContact[]> {
    const supabase = createClient();
    let query = supabase.from('emergency_contacts').select('*');
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    const { data, error } = await query.order('name');
    if (error) {
        console.error("Error fetching emergency contacts:", error);
        return [];
    }
    return data as EmergencyContact[];
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('emergency_contacts').insert([contact]).select().single();
    if (error) {
        console.error("Error adding emergency contact:", error);
        return null;
    }
    return data as EmergencyContact;
}

export async function updateEmergencyContact(contactId: string, updates: Partial<Omit<EmergencyContact, 'id'>>): Promise<EmergencyContact | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('emergency_contacts').update(updates).eq('id', contactId).select().single();
    if (error) {
        console.error(`Error updating emergency contact ${contactId}:`, error);
        return null;
    }
    return data as EmergencyContact;
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('emergency_contacts').delete().eq('id', contactId);
    if (error) {
        console.error(`Error deleting emergency contact ${contactId}:`, error);
        return false;
    }
    return true;
}
