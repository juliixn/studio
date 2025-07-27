
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
        return JSON.parse(JSON.stringify(comunicados));
    } catch (error) {
        console.error("Error fetching comunicados:", error);
        return [];
    }
}

export async function addComunicado(payload: Omit<Comunicado, 'id' | 'createdAt'>): Promise<Comunicado | null> {
    try {
        const newComunicado = await prisma.comunicado.create({
            data: payload
        });
        return JSON.parse(JSON.stringify(newComunicado));
    } catch (error) {
        console.error("Error adding comunicado:", error);
        return null;
    }
}
