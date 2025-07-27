
"use server";

import prisma from './prisma';
import type { PanicAlert } from './definitions';

export async function getActiveAlerts(): Promise<PanicAlert[]> {
    try {
        // En un sistema real, esto podría filtrar por alertas no resueltas.
        // Por ahora, traemos todas las alertas.
        const alerts = await prisma.panicAlert.findMany({
             orderBy: {
                createdAt: 'desc',
            },
        });
        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error("Error fetching active alerts:", error);
        return [];
    }
}

export async function getActiveAlertsForCondo(condominioId: string): Promise<PanicAlert[]> {
     try {
        const alerts = await prisma.panicAlert.findMany({
            where: { condominioId },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return JSON.parse(JSON.stringify(alerts));
    } catch (error) {
        console.error(`Error fetching alerts for condo ${condominioId}:`, error);
        return [];
    }
}

export async function createPanicAlert(payload: Omit<PanicAlert, 'id' | 'createdAt'>): Promise<PanicAlert | null> {
    try {
        // Prevent creating duplicate alerts for the same condo if one is active
        const existingAlert = await prisma.panicAlert.findFirst({
            where: { 
                condominioId: payload.condominioId,
                // Podrías añadir un campo 'clearedAt' para verificar si está activa
            },
        });

        if (existingAlert) {
            console.warn(`Alert already active for condo ${payload.condominioId}`);
            return JSON.parse(JSON.stringify(existingAlert));
        }

        const newAlert = await prisma.panicAlert.create({
            data: payload,
        });
        return JSON.parse(JSON.stringify(newAlert));
    } catch (error) {
        console.error("Error creating panic alert:", error);
        return null;
    }
}

export async function clearPanicAlert(alertId: string): Promise<boolean> {
    try {
        await prisma.panicAlert.delete({
            where: { id: alertId },
        });
        return true;
    } catch (error) {
        console.error(`Error clearing panic alert ${alertId}:`, error);
        return false;
    }
}

