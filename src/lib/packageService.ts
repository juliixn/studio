
"use client";

import { createClient } from './supabase/client';
import type { Package, PackageStatus, User } from './definitions';

// --- Public API using Supabase ---

export async function getPackages(condominioId?: string, recipientId?: string): Promise<Package[]> {
    const supabase = createClient();
    let query = supabase.from('packages').select('*');
    
    if (condominioId) {
        query = query.eq('condominioId', condominioId);
    }
    if (recipientId) {
        query = query.eq('recipientId', recipientId);
    }
    
    const { data, error } = await query.order('receivedAt', { ascending: false });

    if (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
    return data as Package[];
}

export async function getPackageById(packageId: string): Promise<Package | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('packages').select('*').eq('id', packageId).single();
    if (error) {
        // Don't log error if it's just 'not found', that's a valid case for a wrong QR
        if (error.code !== 'PGRST116') {
             console.error(`Error fetching package ${packageId}:`, error);
        }
        return null;
    }
    return data as Package;
}

export async function addPackage(pkg: Omit<Package, 'id' | 'status' | 'receivedAt'>): Promise<Package | null> {
    const supabase = createClient();
    const newPackageData = {
        ...pkg,
        status: pkg.damageNotes ? 'Con Daño' : 'En Recepción',
        receivedAt: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('packages').insert([newPackageData]).select().single();
    
    if (error) {
        console.error("Error adding package:", error);
        return null;
    }
    return data as Package;
}

export async function updatePackage(packageId: string, payload: Partial<Pick<Package, 'status' | 'damageNotes' | 'deliveryPhotoUrl' | 'deliverySignatureUrl' | 'deliveredToName'>>): Promise<Package | null> {
    const supabase = createClient();
    
    const updateData: Partial<Package> = { ...payload };
    if (payload.status === 'Entregado') {
        updateData.deliveredAt = new Date().toISOString();
    }
    
    const { data, error } = await supabase.from('packages').update(updateData).eq('id', packageId).select().single();
    
    if (error) {
        console.error(`Error updating package ${packageId}:`, error);
        return null;
    }
    return data as Package;
}
