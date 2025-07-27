
"use server";

import prisma from './prisma';
import type { AlertResponse } from './definitions';

export async function getAlertResponses(condominioId?: string): Promise<AlertResponse[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }

        const responses = await prisma.alertResponse.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return JSON.parse(JSON.stringify(responses));
    } catch (error) {
        console.error("Error fetching alert responses:", error);
        return [];
    }
}

type AddAlertResponsePayload = Omit<AlertResponse, 'id' | 'createdAt'>;

export async function addAlertResponse(payload: AddAlertResponsePayload): Promise<AlertResponse | null> {
    try {
        const newResponse = await prisma.alertResponse.create({
            data: payload
        });
        return JSON.parse(JSON.stringify(newResponse));
    } catch (error) {
        console.error("Error adding alert response:", error);
        return null;
    }
}
