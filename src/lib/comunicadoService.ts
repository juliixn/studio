"use server";

import prisma from './prisma';
import type { Comunicado } from './definitions';

export async function getComunicados(condominioId?: string): Promise<Comunicado[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.OR = [
                { target: 'all' },
                { target: condominioId }
            ];
        }

        const comunicados = await prisma.comunicado.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
        
        const processedComs = comunicados.map(c => ({
            ...c,
            channels: c.channels ? c.channels.split(',') as ('Push' | 'Email')[] : []
        }))

        return JSON.parse(JSON.stringify(processedComs));
    } catch (error) {
        console.error("Error fetching comunicados:", error);
        return [];
    }
}

export async function addComunicado(payload: Omit<Comunicado, 'id' | 'createdAt'>): Promise<Comunicado | null> {
    try {
        const dataToSave = {
            ...payload,
            channels: Array.isArray(payload.channels) ? payload.channels.join(',') : '',
        }
        const newComunicado = await prisma.comunicado.create({
            data: dataToSave
        });
        return JSON.parse(JSON.stringify(newComunicado));
    } catch (error) {
        console.error("Error adding comunicado:", error);
        return null;
    }
}
