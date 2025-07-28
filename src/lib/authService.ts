
"use server";

import type { User } from './definitions';
import { adminDb } from './firebase';
import * as bcrypt from 'bcrypt';

export async function login(email: string, pass: string): Promise<{ success: boolean; user?: User; message: string }> {
    try {
        const userDoc = await adminDb.collection('users').doc(email).get();

        if (!userDoc.exists) {
            return { success: false, message: 'Usuario no encontrado.' };
        }
        
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        if (!user.password) {
             return { success: false, message: 'La cuenta no tiene una contraseña configurada.' };
        }

        const passwordMatch = await bcrypt.compare(pass, user.password);

        if (!passwordMatch) {
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
