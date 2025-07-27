
"use server";

import prisma from './prisma';
import type { CommunityEvent } from './definitions';

export async function getEvents(condominioId?: string): Promise<CommunityEvent[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.OR = [
                { condominioId: 'all' },
                { condominioId: condominioId }
            ];
        }

        const events = await prisma.communityEvent.findMany({
            where: whereClause,
            orderBy: { start: 'asc' }
        });
        return JSON.parse(JSON.stringify(events));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function addEvent(event: Omit<CommunityEvent, 'id'>): Promise<CommunityEvent | null> {
    try {
        const newEvent = await prisma.communityEvent.create({
            data: event,
        });
        return JSON.parse(JSON.stringify(newEvent));
    } catch (error) {
        console.error("Error adding event:", error);
        return null;
    }
}

export async function updateEvent(eventId: string, updates: Partial<Omit<CommunityEvent, 'id'>>): Promise<CommunityEvent | null> {
    try {
        const updatedEvent = await prisma.communityEvent.update({
            where: { id: eventId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedEvent));
    } catch (error) {
        console.error(`Error updating event ${eventId}:`, error);
        return null;
    }
}

export async function deleteEvent(eventId: string): Promise<boolean> {
    try {
        await prisma.communityEvent.delete({
            where: { id: eventId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error);
        return false;
    }
}
