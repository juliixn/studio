
"use server";

import type { User } from './definitions';
import prisma from './prisma';
import { cookies } from 'next/headers';

export async function login(email: string, pass: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        if (user.password !== pass) {
            return { success: false, message: 'Contraseña incorrecta.' };
        }
        
        // Remove password before storing in cookie
        const { password, ...userToStore } = user;

        // Set a cookie for the session
        cookies().set('loggedInUser', JSON.stringify(userToStore), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return { success: true, user: JSON.parse(JSON.stringify(user)), message: 'Inicio de sesión exitoso.' };

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: 'Ocurrió un error en el servidor.' };
    }
}
