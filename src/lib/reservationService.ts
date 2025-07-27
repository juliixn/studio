
"use server";

import prisma from './prisma';
import type { Reservation, ReservationStatus, CommonArea } from './definitions';

// --- Common Area Service ---
export async function getCommonAreas(condominioId?: string): Promise<CommonArea[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const areas = await prisma.commonArea.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
        });
        return JSON.parse(JSON.stringify(areas));
    } catch (error) {
        console.error("Error fetching common areas:", error);
        return [];
    }
}

export async function addCommonArea(area: Omit<CommonArea, 'id'>): Promise<CommonArea | null> {
    try {
        const newArea = await prisma.commonArea.create({
            data: area,
        });
        return JSON.parse(JSON.stringify(newArea));
    } catch (error) {
        console.error("Error adding common area:", error);
        return null;
    }
}

export async function updateCommonArea(areaId: string, payload: Partial<Omit<CommonArea, 'id'>>): Promise<CommonArea | null> {
     try {
        const updatedArea = await prisma.commonArea.update({
            where: { id: areaId },
            data: payload,
        });
        return JSON.parse(JSON.stringify(updatedArea));
    } catch (error) {
        console.error(`Error updating common area ${areaId}:`, error);
        return null;
    }
}

export async function deleteCommonArea(areaId: string): Promise<boolean> {
    try {
        await prisma.commonArea.delete({
            where: { id: areaId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting common area ${areaId}:`, error);
        return false;
    }
}


// --- Reservation Service ---
export async function getReservations(condominioId?: string, userId?: string): Promise<Reservation[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        if (userId) {
            whereClause.userId = userId;
        }
        const reservations = await prisma.reservation.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        return JSON.parse(JSON.stringify(reservations));
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return [];
    }
}

export async function addReservation(res: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<Reservation | null> {
    try {
        const newReservation = await prisma.reservation.create({
            data: {
                ...res,
                status: 'Pendiente',
            },
        });
        return JSON.parse(JSON.stringify(newReservation));
    } catch (error) {
        console.error("Error adding reservation:", error);
        return null;
    }
}

export async function updateReservationStatus(reservationId: string, status: ReservationStatus): Promise<Reservation | null> {
    try {
        const updatedReservation = await prisma.reservation.update({
            where: { id: reservationId },
            data: { status },
        });
        return JSON.parse(JSON.stringify(updatedReservation));
    } catch (error) {
        console.error(`Error updating reservation status for ${reservationId}:`, error);
        return null;
    }
}
