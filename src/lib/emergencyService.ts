
"use server";

import prisma from './prisma';
import type { EmergencyContact } from './definitions';

export async function getEmergencyContacts(condominioId?: string): Promise<EmergencyContact[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }

        const contacts = await prisma.emergencyContact.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
        });
        return JSON.parse(JSON.stringify(contacts));
    } catch (error) {
        console.error("Error fetching emergency contacts:", error);
        return [];
    }
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact | null> {
    try {
        const newContact = await prisma.emergencyContact.create({
            data: contact,
        });
        return JSON.parse(JSON.stringify(newContact));
    } catch (error) {
        console.error("Error adding emergency contact:", error);
        return null;
    }
}

export async function updateEmergencyContact(contactId: string, updates: Partial<Omit<EmergencyContact, 'id'>>): Promise<EmergencyContact | null> {
    try {
        const updatedContact = await prisma.emergencyContact.update({
            where: { id: contactId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedContact));
    } catch (error) {
        console.error(`Error updating emergency contact ${contactId}:`, error);
        return null;
    }
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
    try {
        await prisma.emergencyContact.delete({
            where: { id: contactId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting emergency contact ${contactId}:`, error);
        return false;
    }
}
