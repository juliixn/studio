
"use server";

import prisma from './prisma';
import type { Address } from './definitions';

export async function getDomicilios(condominioId?: string): Promise<Address[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }

        const domicilios = await prisma.address.findMany({
            where: whereClause,
            orderBy: { fullAddress: 'asc' }
        });
        return JSON.parse(JSON.stringify(domicilios));
    } catch (error) {
        console.error("Error fetching domicilios:", error);
        return [];
    }
}

export async function addDomicilio(domicilioData: Omit<Address, 'id'>): Promise<Address | null> {
    try {
        const newDomicilio = await prisma.address.create({
            data: domicilioData,
        });
        return JSON.parse(JSON.stringify(newDomicilio));
    } catch (error) {
        console.error("Error adding domicilio:", error);
        return null;
    }
}

export async function addDomicilios(domiciliosData: Omit<Address, 'id'>[]): Promise<Address[]> {
    try {
        const result = await prisma.address.createMany({
            data: domiciliosData,
            skipDuplicates: true,
        });
        // createMany does not return the created records, so we can't return them here.
        // The calling function should re-fetch if needed.
        return []; 
    } catch (error) {
        console.error("Error adding domicilios:", error);
        return [];
    }
}

export async function updateDomicilio(id: string, updates: Partial<Omit<Address, 'id'>>): Promise<Address | null> {
     try {
        const updatedDomicilio = await prisma.address.update({
            where: { id },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedDomicilio));
    } catch (error) {
        console.error(`Error updating domicilio ${id}:`, error);
        return null;
    }
}

export async function deleteDomicilio(id: string): Promise<boolean> {
    try {
        await prisma.address.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting domicilio ${id}:`, error);
        return false;
    }
}
