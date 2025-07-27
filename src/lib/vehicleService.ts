
"use server";

import prisma from './prisma';
import type { VehicleInfo } from './definitions';

export async function getUserVehicles(userId: string): Promise<VehicleInfo[]> {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { userId: userId },
        });
        return JSON.parse(JSON.stringify(vehicles));
    } catch (error) {
        console.error(`Error fetching vehicles for user ${userId}:`, error);
        return [];
    }
}

export async function addUserVehicle(userId: string, vehicleData: Omit<VehicleInfo, 'id'>): Promise<VehicleInfo | null> {
    try {
        const newVehicle = await prisma.vehicle.create({
            data: {
                ...vehicleData,
                userId: userId,
            },
        });
        return JSON.parse(JSON.stringify(newVehicle));
    } catch (error) {
        console.error("Error adding user vehicle:", error);
        return null;
    }
}

export async function updateUserVehicle(vehicleId: string, updates: Partial<Omit<VehicleInfo, 'id'>>): Promise<VehicleInfo | null> {
    try {
        const updatedVehicle = await prisma.vehicle.update({
            where: { id: vehicleId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedVehicle));
    } catch (error) {
        console.error(`Error updating vehicle ${vehicleId}:`, error);
        return null;
    }
}

export async function deleteUserVehicle(vehicleId: string): Promise<boolean> {
     try {
        await prisma.vehicle.delete({
            where: { id: vehicleId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting vehicle ${vehicleId}:`, error);
        return false;
    }
}
