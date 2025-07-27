
'use server';

import type { User } from './definitions';

// This function can be used in client components to get the currently logged-in user.
export function getUserFromSession(): User | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const storedUser = window.sessionStorage.getItem('loggedInUser');
    if (storedUser) {
        return JSON.parse(storedUser);
    }
    return null;
}
