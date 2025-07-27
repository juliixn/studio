
"use client";

import { createClient } from './supabase/client';
import type { WorkOrder } from './definitions';

export async function getWorkOrders(condominioId?: string): Promise<WorkOrder[]> {
    const supabase = createClient();
    let query = supabase.from('work_orders').select('*');
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching work orders:", error);
        return [];
    }
    return data as WorkOrder[];
}

export async function addWorkOrder(orderData: Omit<WorkOrder, 'id' | 'createdAt'>): Promise<WorkOrder | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('work_orders').insert([orderData]).select().single();
    if (error) {
        console.error("Error adding work order:", error);
        return null;
    }
    return data as WorkOrder;
}

export async function updateWorkOrder(orderId: string, updates: Partial<Omit<WorkOrder, 'id'>>): Promise<WorkOrder | null> {
    const supabase = createClient();
    if (updates.status === 'Completada' && !updates.completedAt) {
        updates.completedAt = new Date().toISOString();
    }
    const { data, error } = await supabase.from('work_orders').update(updates).eq('id', orderId).select().single();
    if (error) {
        console.error(`Error updating work order ${orderId}:`, error);
        return null;
    }
    return data as WorkOrder;
}

export async function deleteWorkOrder(orderId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('work_orders').delete().eq('id', orderId);
    if (error) {
        console.error(`Error deleting work order ${orderId}:`, error);
        return false;
    }
    return true;
}
