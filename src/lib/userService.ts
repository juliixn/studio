
"use server";

import { adminDb } from './firebase';
import type { User } from './definitions';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function getUsers(): Promise<User[]> {
    try {
        const snapshot = await adminDb.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Handle comma-separated strings for backward compatibility
                condominioIds: Array.isArray(data.condominioIds) ? data.condominioIds : (typeof data.condominioIds === 'string' ? data.condominioIds.split(',').filter(Boolean) : []),
                addressIds: Array.isArray(data.addressIds) ? data.addressIds : (typeof data.addressIds === 'string' ? data.addressIds.split(',').filter(Boolean) : []),
                inhabitantNames: Array.isArray(data.inhabitantNames) ? data.inhabitantNames : (typeof data.inhabitantNames === 'string' ? data.inhabitantNames.split(',').filter(Boolean) : []),
            } as User;
        });
        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function getUserById(userId: string): Promise<User | null> {
    try {
        const doc = await adminDb.collection('users').doc(userId).get();
        if (!doc.exists) return null;
        const data = doc.data();
        if (!data) return null;
        
        const user = { 
            id: doc.id, 
            ...data,
            condominioIds: Array.isArray(data.condominioIds) ? data.condominioIds : (typeof data.condominioIds === 'string' ? data.condominioIds.split(',').filter(Boolean) : []),
            addressIds: Array.isArray(data.addressIds) ? data.addressIds : (typeof data.addressIds === 'string' ? data.addressIds.split(',').filter(Boolean) : []),
            inhabitantNames: Array.isArray(data.inhabitantNames) ? data.inhabitantNames : (typeof data.inhabitantNames === 'string' ? data.inhabitantNames.split(',').filter(Boolean) : []),
        } as User;
        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}

export async function addUser(userData: Partial<User>): Promise<User | null> {
    try {
        const { id, password, ...dataToAdd } = userData;
        const userId = id || userData.email!; // Use email as ID if no ID provided

        if (!password) {
            throw new Error("Password is required for new users.");
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const finalUserData = {
            ...dataToAdd,
            password: hashedPassword
        };

        await adminDb.collection('users').doc(userId).set(finalUserData);
        return { id: userId, ...finalUserData } as User;
    } catch (error) {
        console.error("Error adding user:", error);
        return null;
    }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
        const { password, ...otherUpdates } = updates;
        const dataToUpdate: any = { ...otherUpdates };

        if (password) {
            dataToUpdate.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        await adminDb.collection('users').doc(userId).update(dataToUpdate);
        const updatedDoc = await adminDb.collection('users').doc(userId).get();
        const data = updatedDoc.data();
        if (!data) return null;
        return JSON.parse(JSON.stringify({ 
            id: updatedDoc.id,
            ...data,
            condominioIds: Array.isArray(data.condominioIds) ? data.condominioIds : (typeof data.condominioIds === 'string' ? data.condominioIds.split(',').filter(Boolean) : []),
            addressIds: Array.isArray(data.addressIds) ? data.addressIds : (typeof data.addressIds === 'string' ? data.addressIds.split(',').filter(Boolean) : []),
            inhabitantNames: Array.isArray(data.inhabitantNames) ? data.inhabitantNames : (typeof data.inhabitantNames === 'string' ? data.inhabitantNames.split(',').filter(Boolean) : []),
        }));
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        return null;
    }
}

export async function deleteUser(userId: string): Promise<boolean> {
    try {
        await adminDb.collection('users').doc(userId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        return false;
    }
}
