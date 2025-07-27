
'use server';

import { getUserFromSession as getMockUser, clearUserSession } from './authService';
import type { User } from './definitions';

export async function getUserFromSession(): Promise<User | null> {
    const user = await getMockUser();
    return user;
}

export async function logout() {
    await clearUserSession();
}
