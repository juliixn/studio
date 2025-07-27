
"use server";

import prisma from './prisma';
import type { Asset } from './definitions';

export async function getAssets(condominioId?: string): Promise<Asset[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const assets = await prisma.asset.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
        return JSON.parse(JSON.stringify(assets));
    } catch (error) {
        console.error("Error fetching assets:", error);
        return [];
    }
}

export async function addAsset(assetData: Omit<Asset, 'id'>): Promise<Asset | null> {
    try {
        const newAsset = await prisma.asset.create({
            data: assetData,
        });
        return JSON.parse(JSON.stringify(newAsset));
    } catch (error) {
        console.error("Error adding asset:", error);
        return null;
    }
}

export async function updateAsset(assetId: string, updates: Partial<Omit<Asset, 'id'>>): Promise<Asset | null> {
    try {
        const updatedAsset = await prisma.asset.update({
            where: { id: assetId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedAsset));
    } catch (error) {
        console.error(`Error updating asset ${assetId}:`, error);
        return null;
    }
}

export async function deleteAsset(assetId: string): Promise<boolean> {
    try {
        await prisma.asset.delete({
            where: { id: assetId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting asset ${assetId}:`, error);
        return false;
    }
}
