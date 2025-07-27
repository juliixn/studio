
"use server";

import prisma from './prisma';
import type { VisitorNotification } from './definitions';
import { subHours } from 'date-fns';

export async function getVisitorNotifications(condominioId?: string, residentId?: string): Promise<VisitorNotification[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        if (residentId) {
            whereClause.residentId = residentId;
        }

        const notifications = await prisma.visitorNotification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });

        const now = new Date();
        const twentyFourHoursAgo = subHours(now, 24);

        // Filter out expired notifications on the server side
        const validNotifications = notifications.filter(n => {
            if (n.status === 'Activa') {
                return new Date(n.createdAt) > twentyFourHoursAgo;
            }
            return true;
        });

        return JSON.parse(JSON.stringify(validNotifications));

    } catch (error) {
        console.error("Error fetching visitor notifications:", error);
        return [];
    }
}

export async function addVisitorNotification(payload: Omit<VisitorNotification, 'id' | 'createdAt' | 'status'>): Promise<VisitorNotification | null> {
     try {
        const newNotification = await prisma.visitorNotification.create({
            data: {
                ...payload,
                status: 'Activa',
            },
        });
        return JSON.parse(JSON.stringify(newNotification));
    } catch (error) {
        console.error("Error adding visitor notification:", error);
        return null;
    }
}

export async function updateVisitorNotification(notificationId: string, payload: Partial<Omit<VisitorNotification, 'id'>>): Promise<VisitorNotification | null> {
    try {
        const updatedNotification = await prisma.visitorNotification.update({
            where: { id: notificationId },
            data: payload,
        });
        return JSON.parse(JSON.stringify(updatedNotification));
    } catch (error) {
        console.error(`Error updating visitor notification ${notificationId}:`, error);
        return null;
    }
}
