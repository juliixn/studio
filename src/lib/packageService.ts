
"use server";

import prisma from './prisma';
import type { Package } from './definitions';

export async function getPackages(condominioId?: string, recipientId?: string): Promise<Package[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        if (recipientId) {
            whereClause.recipientId = recipientId;
        }
        
        const packages = await prisma.package.findMany({
            where: whereClause,
            orderBy: { receivedAt: 'desc' },
        });
        return JSON.parse(JSON.stringify(packages));
    } catch (error) {
        console.error("Error fetching packages:", error);
        return [];
    }
}

export async function getPackageById(packageId: string): Promise<Package | null> {
    try {
        const pkg = await prisma.package.findUnique({
            where: { id: packageId },
        });
        return JSON.parse(JSON.stringify(pkg));
    } catch (error) {
        console.error(`Error fetching package ${packageId}:`, error);
        return null;
    }
}

export async function addPackage(pkg: Omit<Package, 'id' | 'status' | 'receivedAt'>): Promise<Package | null> {
    try {
        const newPackageData = {
            ...pkg,
            status: pkg.damageNotes ? 'Con Daño' : 'En Recepción',
            receivedAt: new Date().toISOString(),
        };
        const newPkg = await prisma.package.create({
            data: newPackageData as any,
        });
        return JSON.parse(JSON.stringify(newPkg));
    } catch (error) {
        console.error("Error adding package:", error);
        return null;
    }
}

export async function updatePackage(packageId: string, payload: Partial<Pick<Package, 'status' | 'damageNotes' | 'deliveryPhotoUrl' | 'deliverySignatureUrl' | 'deliveredToName'>>): Promise<Package | null> {
    try {
        const updateData: any = { ...payload };
        if (payload.status === 'Entregado') {
            updateData.deliveredAt = new Date().toISOString();
        }

        const updatedPkg = await prisma.package.update({
            where: { id: packageId },
            data: updateData,
        });
        return JSON.parse(JSON.stringify(updatedPkg));
    } catch (error) {
        console.error(`Error updating package ${packageId}:`, error);
        return null;
    }
}
