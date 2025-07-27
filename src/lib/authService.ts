
"use server";

import type { User } from './definitions';
import prisma from './prisma';

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
        
        // Remove password before sending to client
        const { password, ...userToReturn } = user;

        return { success: true, user: JSON.parse(JSON.stringify(userToReturn)), message: 'Inicio de sesión exitoso.' };

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: 'Ocurrió un error en el servidor.' };
    }
}
