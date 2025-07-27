
"use server";

import type { User } from './definitions';
import prisma from './prisma';

// This is a mock implementation. In a real app, you'd use a robust session management solution.
// For this project, we'll store the logged-in user's info in sessionStorage on the client
// and use this mock service for server-side logic where needed.

export async function login(email: string, pass: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        // IMPORTANT: In a real-world scenario, passwords must be hashed.
        // This is a plain text comparison for simulation purposes only.
        if (user.password !== pass) { 
            return { success: false, message: 'Contraseña incorrecta.' };
        }

        // This is where you would create a real session (e.g., JWT)
        // For now, we return the user object to be stored in client-side session storage.
        return { success: true, user: JSON.parse(JSON.stringify(user)), message: 'Inicio de sesión exitoso.' };

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: 'Ocurrió un error en el servidor.' };
    }
}

// These functions are for client-side session management simulation and don't interact with the server session.
export function saveUserToSession(user: User) {
    if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('loggedInUser', JSON.stringify(user));
    }
}

export function getUserFromSession(): User | null {
    if (typeof window === 'undefined') {
        return null;
    }
    const userJson = window.sessionStorage.getItem('loggedInUser');
    if (!userJson) {
        return null;
    }
    return JSON.parse(userJson);
}

export function clearUserSession(): void {
    if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('loggedInUser');
    }
}
