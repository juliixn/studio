
"use client";

import { createClient } from './supabase/client';
import type { User } from './definitions';

export async function getUsers(): Promise<User[]> {
    const supabase = createClient();
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }
    return profiles as User[];
}

export async function getUserById(userId: string): Promise<User | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
    return data as User;
}

export async function addUser(userData: Partial<User>): Promise<User | null> {
    const supabase = createClient();
    
    // 1. Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email!,
        password: userData.password!,
        options: {
            data: {
                name: userData.name,
                role: userData.role,
                photo_url: userData.photoUrl
            }
        }
    });

    if (authError || !authData.user) {
        console.error("Error creating auth user:", authError?.message);
        // Do not return here if the error is that the user already exists,
        // which might happen if profile creation failed before.
        if (authError && authError.message.includes('User already registered')) {
            console.warn('Auth user already exists, proceeding to profile check.');
        } else {
            return null;
        }
    }

    const userId = authData.user?.id;
    if (!userId) {
        console.error("Could not get user ID after sign up.");
        return null;
    }

    // 2. Create profile in public.profiles
    const profileData = {
        id: userId,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        photoUrl: userData.photoUrl,
        condominioId: userData.condominioId,
        addressId: userData.addressId,
        condominioIds: userData.condominioIds,
        addressIds: userData.addressIds,
        dailySalary: userData.dailySalary,
        allowRemoteCheckIn: userData.allowRemoteCheckIn,
        loanLimit: userData.loanLimit,
        interestRate: userData.interestRate,
        leaseStartDate: userData.leaseStartDate,
        leaseEndDate: userData.leaseEndDate,
        numberOfInhabitants: userData.numberOfInhabitants,
        inhabitantNames: userData.inhabitantNames,
    };

    // Use upsert to avoid errors if the profile already exists from a failed previous attempt
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();
        
    if (profileError) {
        console.error("Error creating/updating user profile:", profileError);
        return null;
    }

    return profile as User;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error(`Error updating user ${userId}:`, error);
        return null;
    }
    return data as User;
}

export async function deleteUser(userId: string): Promise<boolean> {
    const supabase = createClient();
    // This requires special permissions. For now, we will just delete the profile.
    // In a real scenario, you'd call a server-side function to delete the auth user.
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);

    if (profileError) {
        console.error(`Error deleting user profile ${userId}:`, profileError);
        return false;
    }

    // Placeholder for deleting the auth user
    // const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    // if (authError) { ... }
    
    return true;
}
