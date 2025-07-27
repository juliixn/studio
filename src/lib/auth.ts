
'use server';

import { cookies } from 'next/headers';
import type { User } from './definitions';

// This function now works on the server by reading the cookie
export async function getUserFromSession(): Promise<User | null> {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('loggedInUser');
    if (sessionCookie?.value) {
        try {
            return JSON.parse(sessionCookie.value);
        } catch (e) {
            console.error('Failed to parse user cookie in server component:', e);
            return null;
        }
    }
    return null;
}

// This function works on the server to clear the cookie
export async function logout() {
    cookies().delete('loggedInUser');
}
