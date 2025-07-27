
"use server";

import type { User, UserRole } from './definitions';
import prisma from './prisma';

const SESSION_KEY = 'loggedInUser';

// This is a mock implementation. In a real app, you'd use a robust session management solution.
// For this project, we'll store the logged-in user's info in sessionStorage on the client
// and use this mock service for server-side logic where needed.

export async function login(email: string, pass: string): Promise<{ success: boolean; user?: User; message: string }> {
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        return { success: false, message: 'Usuario no encontrado.' };
    }

    if (user.password !== pass) { // Plain text password comparison (NOT FOR PRODUCTION)
        return { success: false, message: 'Contraseña incorrecta.' };
    }

    // This is where you would create a real session (e.g., JWT)
    // For now, we return the user object to be stored in client-side session storage.
    return { success: true, user, message: 'Inicio de sesión exitoso.' };
}

export async function getUserFromSession(): Promise<User | null> {
    // This function is problematic on the server as there's no session.
    // The middleware and client-side logic should handle the user session.
    // Returning null to avoid server-side errors.
    return null;
}

export async function clearUserSession(): Promise<void> {
    // On the server, there's no direct session to clear.
    // The client will handle clearing sessionStorage.
}
