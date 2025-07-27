
"use server";

import prisma from './prisma';
import type { User } from './definitions';

export async function getUsers(): Promise<User[]> {
    try {
        const users = await prisma.user.findMany();
        // Convert comma-separated strings back to arrays for the client
        const processedUsers = users.map(user => ({
            ...user,
            condominioIds: user.condominioIds ? (user.condominioIds as unknown as string).split(',').filter(Boolean) : [],
            addressIds: user.addressIds ? (user.addressIds as unknown as string).split(',').filter(Boolean) : [],
            inhabitantNames: user.inhabitantNames ? (user.inhabitantNames as unknown as string).split(',').filter(Boolean) : [],
        }));
        return JSON.parse(JSON.stringify(processedUsers));
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
         if (!user) return null;
        // Convert comma-separated strings back to arrays for the client
        const processedUser = {
            ...user,
            condominioIds: user.condominioIds ? (user.condominioIds as unknown as string).split(',').filter(Boolean) : [],
            addressIds: user.addressIds ? (user.addressIds as unknown as string).split(',').filter(Boolean) : [],
            inhabitantNames: user.inhabitantNames ? (user.inhabitantNames as unknown as string).split(',').filter(Boolean) : [],
        };
        return JSON.parse(JSON.stringify(processedUser));
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}

export async function addUser(userData: Partial<User>): Promise<User | null> {
    try {
        const dataToAdd: any = {
            ...userData,
            // Convert arrays to comma-separated strings before saving
            condominioIds: Array.isArray(userData.condominioIds) ? userData.condominioIds.join(',') : undefined,
            addressIds: Array.isArray(userData.addressIds) ? userData.addressIds.join(',') : undefined,
            inhabitantNames: Array.isArray(userData.inhabitantNames) ? userData.inhabitantNames.join(',') : undefined,
        };

        const newUser = await prisma.user.create({
            data: dataToAdd,
        });
        return JSON.parse(JSON.stringify(newUser));
    } catch (error) {
        console.error("Error adding user:", error);
        return null;
    }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
         const dataToUpdate: any = {
            ...updates,
            // Convert arrays to comma-separated strings before saving
            condominioIds: Array.isArray(updates.condominioIds) ? updates.condominioIds.join(',') : undefined,
            addressIds: Array.isArray(updates.addressIds) ? updates.addressIds.join(',') : undefined,
            inhabitantNames: Array.isArray(updates.inhabitantNames) ? updates.inhabitantNames.join(',') : undefined,
        };

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
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
