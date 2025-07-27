
"use server";

import prisma from './prisma';
import type { Condominio } from './definitions';

export async function getCondominios(): Promise<Condominio[]> {
    try {
        const condominios = await prisma.condominio.findMany({
            orderBy: { name: 'asc' }
        });
        // Convert comma-separated strings back to arrays
        const processedCondominios = condominios.map(condo => ({
            ...condo,
            guardMenuSections: condo.guardMenuSections ? condo.guardMenuSections.split(',') : [],
        }));
        return JSON.parse(JSON.stringify(processedCondominios));
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
         if (!condominio) return null;
        // Convert comma-separated strings back to arrays
        const processedCondominio = {
            ...condominio,
            guardMenuSections: condominio.guardMenuSections ? condominio.guardMenuSections.split(',') : [],
        };
        return JSON.parse(JSON.stringify(processedCondominio));
    } catch (error) {
        console.error(`Error fetching condominio ${id}:`, error);
        return null;
    }
}

export async function addCondominio(condoData: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
     try {
        const dataToSave: any = {
            ...condoData,
            guardMenuSections: Array.isArray(condoData.guardMenuSections) ? condoData.guardMenuSections.join(',') : undefined,
        };
        const newCondo = await prisma.condominio.create({
            data: dataToSave,
        });
        return JSON.parse(JSON.stringify(newCondo));
    } catch (error) {
        console.error("Error adding condominio:", error);
        return null;
    }
}

export async function updateCondominio(id: string, updates: Partial<Omit<Condominio, 'id'>>): Promise<Condominio | null> {
    try {
        const dataToUpdate: any = {
            ...updates,
            guardMenuSections: Array.isArray(updates.guardMenuSections) ? updates.guardMenuSections.join(',') : undefined,
        };
        const updatedCondo = await prisma.condominio.update({
            where: { id },
            data: dataToUpdate,
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
