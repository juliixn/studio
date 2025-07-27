
"use client";

import { createClient } from './supabase/client';
import type { VisitorNotification } from './definitions';

export async function getVisitorNotifications(condominioId?: string, residentId?: string): Promise<VisitorNotification[]> {
    const supabase = createClient();
    let query = supabase.from('visitor_notifications').select('*');

    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    if (residentId) {
        query = query.eq('residentId', residentId);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching visitor notifications:", error);
        return [];
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter out expired notifications on the client side
    return data.filter(n => {
        if (n.status === 'Activa') {
            const createdAt = new Date(n.createdAt);
            return createdAt > twentyFourHoursAgo;
        }
        return true;
    }) as VisitorNotification[];
}

export async function addVisitorNotification(payload: Omit<VisitorNotification, 'id' | 'createdAt' | 'status'>): Promise<VisitorNotification | null> {
    const supabase = createClient();
    const newNotificationData = {
        ...payload,
        status: 'Activa',
    };
    const { data, error } = await supabase
        .from('visitor_notifications')
        .insert([newNotificationData])
        .select()
        .single();

    if (error) {
        console.error("Error adding visitor notification:", error);
        return null;
    }
    return data as VisitorNotification;
}

export async function updateVisitorNotification(notificationId: string, payload: Partial<VisitorNotification>): Promise<VisitorNotification | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('visitor_notifications')
        .update(payload)
        .eq('id', notificationId)
        .select()
        .single();
    
    if (error) {
        console.error(`Error updating notification ${notificationId}:`, error);
        return null;
    }
    return data as VisitorNotification;
}
