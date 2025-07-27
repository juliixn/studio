import { createClient } from './supabase/server';
import type { User } from './definitions';

export async function getUserFromSession(): Promise<User | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
    
    return profile as User;
}
