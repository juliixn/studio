
'use client';

import { createClient } from './supabase/client';

export const listKeys = [
    'visitorTypes', 
    'vehicleVisitorTypes', 
    'vehicleTypes', 
    'vehicleBrands', 
    'vehicleColors',
    'equipment',
    'incidentCategories',
    'providerTypes',
    'employeeTypes'
] as const;

export type ListKey = typeof listKeys[number];

type ListEntry = {
    list_key: ListKey;
    value: string;
}

export async function getList(key: ListKey): Promise<string[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('managed_lists')
        .select('value')
        .eq('list_key', key)
        .order('value', { ascending: true });

    if (error) {
        console.error(`Error fetching list for key "${key}":`, error);
        return [];
    }

    return data.map(item => item.value);
}

export async function addToList(key: ListKey, value: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('managed_lists').insert([{ list_key: key, value }]);
    
    if (error) {
        // Code '23505' is for unique violation, which is okay, it means the item exists.
        if (error.code !== '23505') {
            console.error(`Error adding to list "${key}":`, error);
            return false;
        }
    }
    return true;
}

export async function removeFromList(key: ListKey, value: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase
        .from('managed_lists')
        .delete()
        .match({ list_key: key, value: value });
    
    if (error) {
        console.error(`Error removing from list "${key}":`, error);
        return false;
    }
    return true;
}
