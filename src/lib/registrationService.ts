
"use server";

import prisma from './prisma';
import type { VehicularRegistration, PedestrianRegistration } from './definitions';

// --- Vehicular Registrations ---

export async function getVehicularRegistrations(condominioId?: string): Promise<VehicularRegistration[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const registrations = await prisma.vehicularRegistration.findMany({
            where: whereClause,
            orderBy: { entryTimestamp: 'desc' }
        });
        return JSON.parse(JSON.stringify(registrations));
    } catch (error) {
        console.error("Error fetching vehicular registrations:", error);
        return [];
    }
}

export async function addVehicularRegistration(reg: Omit<VehicularRegistration, 'id' | 'entryTimestamp'>): Promise<VehicularRegistration | null> {
    try {
        const newReg = await prisma.vehicularRegistration.create({
            data: {
                ...reg,
                entryTimestamp: new Date(),
            }
        });
        return JSON.parse(JSON.stringify(newReg));
    } catch (error) {
        console.error("Error adding vehicular registration:", error);
        return null;
    }
}

export async function updateVehicularExit(id: string): Promise<VehicularRegistration | null> {
     try {
        const updatedReg = await prisma.vehicularRegistration.update({
            where: { id },
            data: { exitTimestamp: new Date() }
        });
        return JSON.parse(JSON.stringify(updatedReg));
    } catch (error) {
        console.error(`Error updating vehicular exit for ${id}:`, error);
        return null;
    }
}

// --- Pedestrian Registrations ---

export async function getPedestrianRegistrations(condominioId?: string): Promise<PedestrianRegistration[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const registrations = await prisma.pedestrianRegistration.findMany({
            where: whereClause,
            orderBy: { entryTimestamp: 'desc' }
        });
        return JSON.parse(JSON.stringify(registrations));
    } catch (error) {
        console.error("Error fetching pedestrian registrations:", error);
        return [];
    }
}

export async function addPedestrianRegistration(reg: Omit<PedestrianRegistration, 'id' | 'entryTimestamp'>): Promise<PedestrianRegistration | null> {
    try {
        const newReg = await prisma.pedestrianRegistration.create({
            data: {
                ...reg,
                entryTimestamp: new Date(),
            }
        });
        return JSON.parse(JSON.stringify(newReg));
    } catch (error) {
        console.error("Error adding pedestrian registration:", error);
        return null;
    }
}

export async function updatePedestrianExit(id: string): Promise<PedestrianRegistration | null> {
    try {
        const updatedReg = await prisma.pedestrianRegistration.update({
            where: { id },
            data: { exitTimestamp: new Date() }
        });
        return JSON.parse(JSON.stringify(updatedReg));
    } catch (error) {
        console.error(`Error updating pedestrian exit for ${id}:`, error);
        return null;
    }
}
