
"use server";

import prisma from './prisma';
import type { Peticion } from './definitions';

export async function getPeticiones(condominioId?: string, creatorId?: string): Promise<Peticion[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        if (creatorId) {
            whereClause.creatorId = creatorId;
        }

        const peticiones = await prisma.peticion.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return JSON.parse(JSON.stringify(peticiones));
    } catch (error) {
        console.error("Error fetching peticiones:", error);
        return [];
    }
}

export async function addPeticion(peticionData: Omit<Peticion, 'id' | 'createdAt' | 'status' | 'comments'>): Promise<Peticion | null> {
    try {
        const newPeticion = await prisma.peticion.create({
            data: {
                ...peticionData,
                status: 'Abierta',
                comments: {
                    create: [] // Start with no comments
                }
            }
        });
        return JSON.parse(JSON.stringify(newPeticion));
    } catch (error) {
        console.error("Error adding peticion:", error);
        return null;
    }
}

export async function updatePeticion(peticionId: string, updates: Partial<Peticion>): Promise<Peticion | null> {
    try {
        const { comments, ...restOfUpdates } = updates;
        
        const updatedPeticion = await prisma.peticion.update({
            where: { id: peticionId },
            data: {
                ...restOfUpdates,
                ...(comments && {
                    comments: {
                        create: comments.map(c => ({
                            authorId: c.authorId,
                            authorName: c.authorName,
                            text: c.text,
                        }))
                    }
                })
            },
        });
        return JSON.parse(JSON.stringify(updatedPeticion));
    } catch (error) {
        console.error("Error updating peticion:", error);
        return null;
    }
}
