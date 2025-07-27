
"use server";

import prisma from './prisma';
import type { User } from './definitions';

export async function getUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany();
        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}

export async function addUser(userData: Partial<User>): Promise<User | null> {
    try {
        // Ensure role is valid
        const dataToAdd = {
            username: userData.username || '',
            name: userData.name || '',
            email: userData.email || '',
            password: userData.password || 'password123',
            role: userData.role || 'Propietario',
            ...userData,
        };
        const newUser = await prisma.user.create({
            data: dataToAdd as any, // Use `as any` to bypass strict type checking for dynamic data
        });
        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.error("Error adding user:", error);
        return null;
    }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updates
        });
        return JSON.parse(JSON.stringify(updatedUser));
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return null;
    }
}

export async function deleteUser(userId: string): Promise<boolean> {
    try {
        await prisma.user.delete({
            where: { id: userId }
        });
        return true;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        return false;
    }
}
