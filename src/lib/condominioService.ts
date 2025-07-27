
"use server";

import prisma from './prisma';
import type { Condominio } from './definitions';

export async function getCondominios(): Promise<Condominio[]> {
    try {
        const condominios = await prisma.condominio.findMany({
            orderBy: { name: 'asc' }
        });
        return JSON.parse(JSON.stringify(condominios));
    } catch (error) {
        console.error("Error fetching condominios:", error);
        return [];
    }
}

export async function getCondominioById(id: string): Promise<Condominio | null> {
    try {
        const condominio = await prisma.condominio.findUnique({
            where: { id }
        });
        return JSON.parse(JSON.stringify(condominio));
    } catch (error) {
        console.error(`Error fetching condominio ${id}:`, error);
        return null;
    }
}

export async function addCondominio(condoData: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
     try {
        const newCondo = await prisma.condominio.create({
            data: condoData as any, // Cast because of optional fields
        });
        return JSON.parse(JSON.stringify(newCondo));
    } catch (error) {
        console.error("Error adding condominio:", error);
        return null;
    }
}

export async function updateCondominio(id: string, updates: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
    try {
        const updatedCondo = await prisma.condominio.update({
            where: { id },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedCondo));
    } catch (error) {
        console.error(`Error updating condominio ${id}:`, error);
        return null;
    }
}

export async function deleteCondominio(id: string): Promise<boolean> {
     try {
        await prisma.condominio.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting condominio ${id}:`, error);
        return false;
    }
}
